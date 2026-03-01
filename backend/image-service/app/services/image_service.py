import io
from PIL import Image, ImageEnhance, ImageOps
import img2pdf

def convert_image_format(image_bytes: bytes, target_format: str) -> bytes:
    """
    Changes image format (e.g., PNG to JPG, WEBP to PNG).
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    # Normalize format name for Pillow
    target_format = target_format.upper()
    if target_format == "JPG":
        target_format = "JPEG"
    
    # Handle transparency if converting to JPEG
    if target_format == "JPEG" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    output = io.BytesIO()
    img.save(output, format=target_format)
    return output.getvalue()

def images_to_pdf_service(image_list: list[bytes]) -> bytes:
    """
    Converts one or more images into a single PDF file.
    """
    # img2pdf is efficient for this
    return img2pdf.convert(image_list)

def edit_image_service(
    image_bytes: bytes, 
    brightness: float = 1.0, 
    contrast: float = 1.0, 
    sharpness: float = 1.0,
    grayscale: bool = False,
    rotate: int = 0
) -> bytes:
    """
    Edits image: brightness, contrast, sharpness, grayscale, and rotation.
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    if grayscale:
        img = ImageOps.grayscale(img)
        
    if brightness != 1.0:
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(brightness)
        
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(contrast)
        
    if sharpness != 1.0:
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(sharpness)
        
    if rotate != 0:
        img = img.rotate(rotate, expand=True)
        
    output = io.BytesIO()
    # Preserve original format or default to PNG
    save_format = img.format if img.format else "PNG"
    img.save(output, format=save_format)
    return output.getvalue()

def crop_image_percentage(
    image_bytes: bytes, 
    left_pct: float = 0, 
    right_pct: float = 0, 
    top_pct: float = 0, 
    bottom_pct: float = 0
) -> bytes:
    """
    Crops image from sides as percentage.
    """
    img = Image.open(io.BytesIO(image_bytes))
    width, height = img.size
    
    left = width * (left_pct / 100)
    top = height * (top_pct / 100)
    right = width * (1 - right_pct / 100)
    bottom = height * (1 - bottom_pct / 100)
    
    img = img.crop((left, top, right, bottom))
    
    output = io.BytesIO()
    save_format = img.format if img.format else "PNG"
    img.save(output, format=save_format)
    return output.getvalue()
