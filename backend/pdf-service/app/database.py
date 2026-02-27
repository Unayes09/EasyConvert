import os
import time
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

MYSQL_URL = os.getenv("MYSQL_URL", "mysql+pymysql://root:20020808@mysql:3306/easyconvert")

engine = create_engine(MYSQL_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            print("PDF-Service: Successfully connected to the database!")
            break
        except OperationalError:
            retries -= 1
            print(f"PDF-Service: DB connection failed. Retrying... ({5 - retries}/5)")
            time.sleep(5)
