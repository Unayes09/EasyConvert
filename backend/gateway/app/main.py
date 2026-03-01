from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import io
from sqlalchemy.orm import Session
from .database import get_db, init_db
from .services.file_service import save_upload_to_db
from .schemas.file_schema import UploadResponse

app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.api_route("/pdf/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_pdf(path: str, request: Request):
    async with httpx.AsyncClient() as client:
        url = f"{PDF_SERVICE_URL}/{path}"
        
        # Prepare the request for the microservice
        headers = dict(request.headers)
        headers.pop("host", None) # Let httpx handle the host header
        headers.pop("content-length", None) # Let httpx calculate content length
        
        # Forward the request
        try:
            method = request.method
            if method == "GET":
                response = await client.get(url, params=request.query_params, headers=headers)
            elif method == "POST":
                # Check if it's a multipart/form-data request
                if "multipart/form-data" in request.headers.get("content-type", ""):
                    # Remove content-type so httpx can set the correct multipart boundary
                    headers.pop("content-type", None)
                    # Forwarding files is tricky with httpx, we'll read the body and forward
                    form = await request.form()
                    files_to_forward = []
                    data = {}
                    
                    # Use .multi_items() to handle multiple files with the same key (e.g. List[UploadFile])
                    for key, value in form.multi_items():
                        if hasattr(value, "filename") and value.filename:
                            # httpx supports a list of tuples for multiple files with the same key
                            files_to_forward.append((key, (value.filename, await value.read(), value.content_type)))
                        else:
                            data[key] = value
                            
                    response = await client.post(url, data=data, files=files_to_forward, params=request.query_params, headers=headers)
                else:
                    content = await request.body()
                    response = await client.post(url, content=content, params=request.query_params, headers=headers)
            else:
                response = await client.request(method, url, params=request.query_params, headers=headers)
            
            # Return the response from the microservice
            content_type = response.headers.get("content-type", "")
            
            # Forward errors from the microservice if they occur
            if response.status_code >= 400:
                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text
                raise HTTPException(status_code=response.status_code, detail=error_detail)

            # Handle PDF streaming responses
            if "application/pdf" in content_type:
                return StreamingResponse(
                    io.BytesIO(response.content),
                    media_type="application/pdf",
                    headers={"Content-Disposition": response.headers.get("Content-Disposition")}
                )
            
            return response.json() if "application/json" in content_type else response.content
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Error connecting to PDF service: {exc}")

@app.api_route("/image/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_image(path: str, request: Request):
    async with httpx.AsyncClient() as client:
        url = f"{IMAGE_SERVICE_URL}/{path}"
        
        # Prepare the request for the microservice
        headers = dict(request.headers)
        headers.pop("host", None) # Let httpx handle the host header
        headers.pop("content-length", None) # Let httpx calculate content length
        
        # Forward the request
        try:
            method = request.method
            if method == "GET":
                response = await client.get(url, params=request.query_params, headers=headers)
            elif method == "POST":
                # Check if it's a multipart/form-data request
                if "multipart/form-data" in request.headers.get("content-type", ""):
                    # Remove content-type so httpx can set the correct multipart boundary
                    headers.pop("content-type", None)
                    form = await request.form()
                    files_to_forward = []
                    data = {}
                    
                    # Use .multi_items() to handle multiple files with the same key
                    for key, value in form.multi_items():
                        if hasattr(value, "filename") and value.filename:
                            files_to_forward.append((key, (value.filename, await value.read(), value.content_type)))
                        else:
                            data[key] = value
                            
                    response = await client.post(url, data=data, files=files_to_forward, params=request.query_params, headers=headers)
                else:
                    content = await request.body()
                    response = await client.post(url, content=content, params=request.query_params, headers=headers)
            else:
                response = await client.request(method, url, params=request.query_params, headers=headers)
            
            # Return the response from the microservice
            content_type = response.headers.get("content-type", "")
            
            # Forward errors from the microservice if they occur
            if response.status_code >= 400:
                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text
                raise HTTPException(status_code=response.status_code, detail=error_detail)

            # Handle PDF or Image streaming responses
            if any(t in content_type for t in ["application/pdf", "image/"]):
                return StreamingResponse(
                    io.BytesIO(response.content),
                    media_type=content_type,
                    headers={"Content-Disposition": response.headers.get("Content-Disposition")}
                )
            
            return response.json() if "application/json" in content_type else response.content
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Error connecting to Image service: {exc}")
