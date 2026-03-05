from datetime import datetime

def notification_document(user_id: str, type: str, source_user_id: str, post_id: str = None):
    return {
        "user_id": user_id,
        "type": type,  # "like" or "follow"
        "source_user_id": source_user_id,
        "post_id": post_id,
        "read": False,
        "created_at": datetime.now()
    }
