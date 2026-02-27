from pydantic import BaseModel

class TaskStatusResponse(BaseModel):
    status: str

class AsyncConvertResponse(BaseModel):
    task_id: str
