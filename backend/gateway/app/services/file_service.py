from fastapi import UploadFile
from sqlalchemy.orm import Session
from ..database import FileStore
import uuid

async def save_upload_to_db(file: UploadFile, db: Session) -> str:
    """
    Saves an UploadFile into the database and returns the generated ID.
    """
    # Generate unique ID
    file_id = str(uuid.uuid4())
    
    # Read file content
    content = await file.read()
    
    # Create FileStore entry
    new_file = FileStore(
        id=file_id,
        file_data=content,
        file_type=file.content_type,
        status="pending"
    )
    
    # Add to database
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return file_id
