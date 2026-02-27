import os
import uuid
import time
from sqlalchemy import create_engine, Column, String, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

# Get connection URL from environment variables
MYSQL_URL = os.getenv("MYSQL_URL", "mysql+pymysql://root:20020808@mysql:3306/easyconvert")

engine = create_engine(MYSQL_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class FileStore(Base):
    __tablename__ = "file_store"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_data = Column(LargeBinary(length=(2**32)-1)) # Using LargeBinary for LongBlob (up to 4GB)
    file_type = Column(String(50))
    status = Column(String(20), default="pending") # 'pending', 'processing', 'completed'

# Create tables with retry logic
def init_db():
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            print("Successfully connected to the database!")
            break
        except OperationalError as e:
            retries -= 1
            print(f"Database connection failed. Retrying... ({5 - retries}/5)")
            time.sleep(5)
    if retries == 0:
        print("Could not connect to the database. Starting anyway, but DB operations will fail.")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
