from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ---------------------------
# REQUEST MODELS
# ---------------------------

class PostCreate(BaseModel):
    title: str
    content: str
    community_id: str = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


# ---------------------------
# DATABASE DOCUMENT STRUCTURE
# ---------------------------

def post_document(title: str, content: str, user_id: str, community_id: str = None, content_type: str = "text", image_url: str = None, video_url: str = None):
    return {
        "title": title,
        "content": content,
        "author_id": user_id,
        "community_id": community_id,
        "mature": False,
        
        # Media Content
        "content_type": content_type,  # "text" | "image" | "video"
        "image_url": image_url,
        "video_url": video_url,

        # Social Features
        "likes": [],
        "comments_count": 0,

        # AI Moderation
        "flagged": False,
        "moderation_score": 0,
        "moderation_result": {},
        "safety_score": 100,
        "risk_level": "LOW",
        "redacted": False,
        
        # AI Features
        "topic": "General",

        "created_at": datetime.now()
    }


# ---------------------------
# RESPONSE MODEL (Optional)
# ---------------------------

class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    author_id: str
    likes_count: int
    liked_by_me: bool
    flagged: bool
