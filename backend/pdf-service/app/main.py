import io
import uuid
import zipfile
from typing import List, Annotated
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .database import get_db, init_db
from .models import FileStore, ProcessedImages
from .tasks import convert_pdf_to_images_task
from .utils.zip_utils import create_zip_from_images, create_zip_from_pdfs
from .schemas.pdf_schema import AsyncConvertResponse, TaskStatusResponse
from .services.pdf_service import (
    insert_image_to_pdf, 
    split_pdf_service, 
    add_page_numbers_service, 
    pdf_to_docx_service,
    merge_pdfs_service
)

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

@app.post("/insert-image")
async def insert_image(
    pdf_file: UploadFile = File(...),
    image_file: UploadFile = File(...),
    split_index: int = 0
):
    """
    Inserts an image into a PDF as a new page at the given index.
    Returns the modified PDF file directly.
    """
    if not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if not any(image_file.filename.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg"]):
        raise HTTPException(status_code=400, detail="Only image files (PNG, JPG, JPEG) are allowed")
    
    pdf_bytes = await pdf_file.read()
    image_bytes = await image_file.read()
    
    try:
        modified_pdf = insert_image_to_pdf(pdf_bytes, image_bytes, split_index)
        
        return StreamingResponse(
            io.BytesIO(modified_pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=modified_{pdf_file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert image: {str(e)}")

@app.post("/split-pdf")
async def split_pdf(
    file: UploadFile = File(...),
    ranges: str = "1-1"
):
    """
    Splits a PDF based on comma-separated ranges.
    Returns a ZIP containing separate PDF files for each range.
    Example: "1-3, 5, 8-10"
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    pdf_bytes = await file.read()
    try:
        split_results = split_pdf_service(pdf_bytes, ranges)
        
        # If only one range was requested, return the PDF directly
        if len(split_results) == 1:
            filename, content = split_results[0]
            return StreamingResponse(
                io.BytesIO(content),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        # If multiple ranges, bundle into a ZIP
        zip_buffer = create_zip_from_pdfs(split_results)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=split_{file.filename}.zip"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Split failed: {str(e)}")

@app.post("/add-page-numbers")
async def add_page_numbers(file: UploadFile = File(...)):
    """
    Adds page numbers to the bottom right of each page.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    pdf_bytes = await file.read()
    try:
        modified_pdf = add_page_numbers_service(pdf_bytes)
        return StreamingResponse(
            io.BytesIO(modified_pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=numbered_{file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adding page numbers failed: {str(e)}")

@app.post("/pdf-to-docx")
async def pdf_to_docx(file: UploadFile = File(...)):
    """
    Converts a PDF file to a DOCX document.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    pdf_bytes = await file.read()
    try:
        docx_bytes = pdf_to_docx_service(pdf_bytes)
        docx_filename = file.filename.rsplit(".", 1)[0] + ".docx"
        
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={docx_filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF to DOCX conversion failed: {str(e)}")

@app.post("/merge-pdfs")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """
    Merges multiple PDF files into a single document.
    Files are merged in the order they are uploaded.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    pdf_list = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
        content = await file.read()
        pdf_list.append(content)
    
    try:
        merged_pdf = merge_pdfs_service(pdf_list)
        return StreamingResponse(
            io.BytesIO(merged_pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=merged.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(e)}")

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
