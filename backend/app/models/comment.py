from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None

def comment_document(post_id: str, user_id: str, content: str, parent_id: str = None):
    return {
        "post_id": post_id,
        "user_id": user_id,
        "content": content,
        "parent_id": parent_id,
        "likes": [],
        "likes_count": 0,
        "created_at": datetime.now()
    }