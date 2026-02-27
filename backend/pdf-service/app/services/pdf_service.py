import fitz
import uuid
from sqlalchemy.orm import Session
from ..models import FileStore, ProcessedImages

def process_pdf_conversion(file_id: str, dpi: int, db: Session):
    # Fetch the PDF
    file_record = db.query(FileStore).filter(FileStore.id == file_id).first()
    if not file_record:
        return f"Error: File {file_id} not found"

    # Update status to processing
    file_record.status = "processing"
    db.commit()

    # Open PDF with PyMuPDF
    pdf_document = fitz.open(stream=file_record.file_data, filetype="pdf")
    
    try:
        total_pages = len(pdf_document)
        for page_num in range(total_pages):
            page = pdf_document.load_page(page_num)
            pix = page.get_pixmap(dpi=dpi)
            image_bytes = pix.tobytes("png")

            # Save each image to ProcessedImages
            processed_image = ProcessedImages(
                id=str(uuid.uuid4()),
                parent_file_id=file_id,
                image_data=image_bytes,
                page_number=page_num + 1
            )
            db.add(processed_image)
            db.commit()

        # Update status to completed
        file_record.status = "completed"
        db.commit()
        
        return f"Successfully processed {total_pages} pages for {file_id}"
    finally:
        pdf_document.close()
