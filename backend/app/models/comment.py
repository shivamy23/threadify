from pydantic import BaseModel
from datetime import datetime

class CommentCreate(BaseModel):
    content: str


def comment_document(content: str, post_id: str, user_id: str):
    return {
        "content": content,
        "post_id": post_id,
        "author_id": user_id,
        "created_at": datetime.utcnow()
    }
