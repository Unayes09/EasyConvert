import io
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Annotated
from .services.image_service import (
    convert_image_format,
    images_to_pdf_service,
    edit_image_service,
    crop_image_percentage
)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Image Service is running"}

@app.post("/change-format")
async def change_format(
    file: UploadFile = File(...),
    target_format: str = Query(..., description="Target image format: PNG, JPG, JPEG, WEBP")
):
    """
    Changes image format.
    """
    image_bytes = await file.read()
    try:
        modified_image = convert_image_format(image_bytes, target_format)
        
        # Normalize media type
        fmt = target_format.lower()
        if fmt == "jpg":
            fmt = "jpeg"
        media_type = f"image/{fmt}"
        
        return StreamingResponse(
            io.BytesIO(modified_image),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename=converted.{fmt}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Format conversion failed: {str(e)}")

@app.post("/images-to-pdf")
async def images_to_pdf(
    files: list[UploadFile] = File(..., description="Select multiple images to combine into a PDF")
):
    """
    Converts one or more images into a single PDF file.
    """
    image_list = []
    for file in files:
        image_list.append(await file.read())
    
    try:
        pdf_bytes = images_to_pdf_service(image_list)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=images_to_pdf.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Images to PDF conversion failed: {str(e)}")

@app.post("/edit-image")
async def edit_image(
    file: UploadFile = File(...),
    brightness: float = 1.0,
    contrast: float = 1.0,
    sharpness: float = 1.0,
    grayscale: bool = False,
    rotate: int = 0
):
    """
    Edits image: brightness, contrast, sharpness, grayscale, and rotation.
    """
    image_bytes = await file.read()
    try:
        modified_image = edit_image_service(
            image_bytes, 
            brightness, 
            contrast, 
            sharpness, 
            grayscale, 
            rotate
        )
        return StreamingResponse(
            io.BytesIO(modified_image),
            media_type=file.content_type,
            headers={"Content-Disposition": f"attachment; filename=edited_{file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image editing failed: {str(e)}")

@app.post("/crop-image")
async def crop_image(
    file: UploadFile = File(...),
    left: float = Query(0, ge=0, le=100, description="Percentage to crop from left"),
    right: float = Query(0, ge=0, le=100, description="Percentage to crop from right"),
    top: float = Query(0, ge=0, le=100, description="Percentage to crop from top"),
    bottom: float = Query(0, ge=0, le=100, description="Percentage to crop from bottom")
):
    """
    Crops image from sides as percentage.
    """
    image_bytes = await file.read()
    try:
        modified_image = crop_image_percentage(image_bytes, left, right, top, bottom)
        return StreamingResponse(
            io.BytesIO(modified_image),
            media_type=file.content_type,
            headers={"Content-Disposition": f"attachment; filename=cropped_{file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image cropping failed: {str(e)}")
