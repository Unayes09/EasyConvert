from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
import httpx
import os
from sqlalchemy.orm import Session
from .database import get_db, init_db
from .services.file_service import save_upload_to_db
from .schemas.file_schema import UploadResponse

app = FastAPI()

# Initialize Database (Create tables if not exists)
@app.on_event("startup")
def startup():
    init_db()

# Get service URLs from environment variables
PDF_SERVICE_URL = os.getenv("PDF_SERVICE_URL", "http://pdf-service:8001")
IMAGE_SERVICE_URL = os.getenv("IMAGE_SERVICE_URL", "http://image-service:8002")

@app.get("/")
def read_root():
    return {"message": "Gateway Service is running"}

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Uploads a file to the database and returns the generated file ID.
    """
    try:
        file_id = await save_upload_to_db(file, db)
        return {"id": file_id, "status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@app.get("/pdf/{path:path}")
async def proxy_pdf(path: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PDF_SERVICE_URL}/{path}")
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Error connecting to PDF service: {exc}")

@app.get("/image/{path:path}")
async def proxy_image(path: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{IMAGE_SERVICE_URL}/{path}")
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Error connecting to Image service: {exc}")
