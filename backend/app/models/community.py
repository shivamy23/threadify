from pydantic import BaseModel
from datetime import datetime

class CommunityCreate(BaseModel):
    name: str
    description: str
    icon: str = "🏠"
    topic: str = "General"
    type: str = "public"  # public, restricted, private
    mature: bool = False

def community_document(name: str, description: str, icon: str, topic: str, type: str, mature: bool, created_by: str):
    slug = name.lower().replace(" ", "-").replace("_", "-")
    
    default_rules = [
        {"id": 1, "title": "Be respectful and civil", "description": "Treat others with respect. No personal attacks or harassment."},
        {"id": 2, "title": "No spam or self-promotion", "description": "Avoid excessive self-promotion and spam content."},
        {"id": 3, "title": "Stay on topic", "description": "Keep posts relevant to the community's purpose."},
        {"id": 4, "title": "No hate speech or harassment", "description": "Hate speech, discrimination, and harassment are not tolerated."},
        {"id": 5, "title": "Follow platform guidelines", "description": "Adhere to Threadify's terms of service and community guidelines."}
    ]
    
    return {
        "name": name,
        "slug": slug,
        "description": description,
        "icon": icon,
        "topic": topic,
        "type": type,
        "mature": mature,
        "created_by": created_by,
        "members": [created_by],
        "members_count": 1,
        "posts_count": 0,
        "rules": default_rules,
        "created_at": datetime.now()
    }
