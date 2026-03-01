import fitz
import uuid
import io
import os
import tempfile
from pdf2docx import Converter
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

def insert_image_to_pdf(pdf_bytes: bytes, image_bytes: bytes, split_index: int) -> bytes:
    """
    Inserts an image into a PDF as a new page at the given split_index.
    If split_index is 0, it's inserted at the very beginning.
    The new page size will match the existing pages.
    """
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
    image_stream = fitz.open(stream=image_bytes, filetype="png") if image_bytes.startswith(b"\x89PNG") else fitz.open(stream=image_bytes)
    
    try:
        # Get the size of the first page to match (or use default if empty)
        if len(pdf_document) > 0:
            rect = pdf_document[0].rect
        else:
            rect = fitz.PaperRect("a4")

        # Create a new blank page at the specified index
        # PyMuPDF indices are 0-based. split_index=0 means insert at 0.
        new_page = pdf_document.new_page(pno=split_index, width=rect.width, height=rect.height)
        
        # Insert the image into the new page
        # We'll center the image or fit it to the page
        new_page.insert_image(rect, stream=image_bytes)
        
        # Save the modified PDF to a buffer
        output_buffer = io.BytesIO()
        pdf_document.save(output_buffer)
        return output_buffer.getvalue()
    finally:
        pdf_document.close()
        image_stream.close()

def split_pdf_service(pdf_bytes: bytes, ranges: str) -> list[tuple[str, bytes]]:
    """
    Splits a PDF based on provided ranges (e.g., "1-3, 5, 7-10").
    Returns a list of tuples containing (filename, pdf_bytes) for each range.
    """
    src_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    results = []
    try:
        page_groups = [r.strip() for r in ranges.split(",")]
        for group in page_groups:
            new_doc = fitz.open()
            if "-" in group:
                start, end = map(int, group.split("-"))
                new_doc.insert_pdf(src_doc, from_page=start-1, to_page=end-1)
                filename = f"pages_{start}_to_{end}.pdf"
            else:
                page_num = int(group)
                new_doc.insert_pdf(src_doc, from_page=page_num-1, to_page=page_num-1)
                filename = f"page_{page_num}.pdf"
            
            output_buffer = io.BytesIO()
            new_doc.save(output_buffer)
            results.append((filename, output_buffer.getvalue()))
            new_doc.close()
        return results
    finally:
        src_doc.close()

def merge_pdfs_service(pdf_list: list[bytes]) -> bytes:
    """
    Merges multiple PDF files into one.
    Takes a list of PDF bytes and returns the merged PDF bytes.
    """
    merged_doc = fitz.open()
    try:
        for pdf_bytes in pdf_list:
            src_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            merged_doc.insert_pdf(src_doc)
            src_doc.close()
        
        output_buffer = io.BytesIO()
        merged_doc.save(output_buffer)
        return output_buffer.getvalue()
    finally:
        merged_doc.close()

def add_page_numbers_service(pdf_bytes: bytes) -> bytes:
    """
    Adds page numbers to the bottom right of each page.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = f"Page {page_num + 1} of {len(doc)}"
            # Position: bottom right
            # Calculate coordinates based on page size
            rect = page.rect
            point = fitz.Point(rect.width - 100, rect.height - 30)
            page.insert_text(point, text, fontsize=10, color=(0, 0, 0))
            
        output_buffer = io.BytesIO()
        doc.save(output_buffer)
        return output_buffer.getvalue()
    finally:
        doc.close()

def pdf_to_docx_service(pdf_bytes: bytes) -> bytes:
    """
    Converts PDF bytes to DOCX bytes using pdf2docx.
    Uses temporary files for conversion.
    """
    # Create temporary files for PDF and DOCX
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(pdf_bytes)
        temp_pdf_path = temp_pdf.name
    
    temp_docx_path = temp_pdf_path.replace(".pdf", ".docx")
    
    try:
        # Convert PDF to DOCX
        cv = Converter(temp_pdf_path)
        cv.convert(temp_docx_path, start=0, end=None)
        cv.close()
        
        # Read the DOCX bytes
        with open(temp_docx_path, "rb") as docx_file:
            docx_bytes = docx_file.read()
        
        return docx_bytes
    finally:
        # Clean up temporary files
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        if os.path.exists(temp_docx_path):
            os.remove(temp_docx_path)
