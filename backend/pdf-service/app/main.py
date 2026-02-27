import io
import uuid
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .database import get_db, init_db
from .models import FileStore, ProcessedImages
from .tasks import convert_pdf_to_images_task
from .utils.zip_utils import create_zip_from_images
from .schemas.pdf_schema import AsyncConvertResponse, TaskStatusResponse

app = FastAPI()

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "PDF Service is running"}

@app.post("/convert-pdf-async", response_model=AsyncConvertResponse)
async def convert_pdf_async(
    file: UploadFile = File(...), 
    dpi: int = 300, 
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save the PDF bytes to MySQL FileStore
    file_id = str(uuid.uuid4())
    content = await file.read()
    
    new_file = FileStore(
        id=file_id,
        file_data=content,
        file_type=file.content_type,
        status="pending"
    )
    db.add(new_file)
    db.commit()
    
    # Trigger the Celery task
    convert_pdf_to_images_task.delay(file_id, dpi)
    
    return {"task_id": file_id}

@app.get("/status/{task_id}", response_model=TaskStatusResponse)
def get_status(task_id: str, db: Session = Depends(get_db)):
    file_record = db.query(FileStore).filter(FileStore.id == task_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"status": file_record.status}

@app.get("/download-images/{task_id}")
async def download_images(
    task_id: str, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    file_record = db.query(FileStore).filter(FileStore.id == task_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if file_record.status == "failed":
        raise HTTPException(status_code=500, detail="The conversion process failed. Check worker logs for details.")
    
    if file_record.status != "completed":
        return {"status": file_record.status, "message": "Images are not ready yet. Please check back later."}
    
    processed_images = db.query(ProcessedImages).filter(ProcessedImages.parent_file_id == task_id).all()
    if not processed_images:
        raise HTTPException(status_code=404, detail="No images found for this task")

    # Bundle into ZIP in memory
    zip_buffer = create_zip_from_images(processed_images)

    # Cleanup logic after sending response
    def cleanup():
        # Re-fetch records inside the cleanup to avoid session issues
        db_cleanup = next(get_db())
        db_cleanup.query(ProcessedImages).filter(ProcessedImages.parent_file_id == task_id).delete()
        db_cleanup.query(FileStore).filter(FileStore.id == task_id).delete()
        db_cleanup.commit()
        db_cleanup.close()

    background_tasks.add_task(cleanup)

    return StreamingResponse(
        zip_buffer, 
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=images_{task_id}.zip"}
    )
