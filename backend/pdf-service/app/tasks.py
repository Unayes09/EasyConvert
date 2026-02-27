import logging
from .celery_app import celery_app
from .database import SessionLocal
from .services.pdf_service import process_pdf_conversion
from .models import FileStore

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.convert_pdf_to_images_task")
def convert_pdf_to_images_task(file_id: str, dpi: int):
    """
    Celery task wrapper for PDF conversion.
    Handles session management and high-level error reporting.
    """
    db = SessionLocal()
    try:
        result = process_pdf_conversion(file_id, dpi, db)
        return result
    except Exception as e:
        logger.error(f"Task failed for file {file_id}: {str(e)}")
        # Ensure status is updated to failed on critical errors
        file_record = db.query(FileStore).filter(FileStore.id == file_id).first()
        if file_record:
            file_record.status = "failed"
            db.commit()
        return f"Error: {str(e)}"
    finally:
        db.close()

