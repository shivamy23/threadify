from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PostCreate(BaseModel):
    title: str
    content: str


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

def post_document(title: str, content: str, user_id: str):
    return {
        "title": title,
        "content": content,
        "author_id": user_id,
        "created_at": datetime.now()
    }

class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    author_id: str
