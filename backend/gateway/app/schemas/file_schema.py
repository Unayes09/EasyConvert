from pydantic import BaseModel

class UploadResponse(BaseModel):
    id: str
    status: str
