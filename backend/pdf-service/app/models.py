import uuid
from sqlalchemy import Column, String, LargeBinary, Integer, ForeignKey
from .database import Base

class FileStore(Base):
    __tablename__ = "file_store"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_data = Column(LargeBinary(length=(2**32)-1))
    file_type = Column(String(50))
    status = Column(String(20), default="pending")

class ProcessedImages(Base):
    __tablename__ = "processed_images"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_file_id = Column(String(36), ForeignKey("file_store.id"))
    image_data = Column(LargeBinary(length=(2**32)-1))
    page_number = Column(Integer)
