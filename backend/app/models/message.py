from datetime import datetime
from typing import Optional

def message_document(conversation_id: str, sender_id: str, receiver_id: str, content: str):
    return {
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "read": False,
        "created_at": datetime.now()
    }

def conversation_document(participants: list, last_message: Optional[str] = None):
    return {
        "participants": sorted(participants),  # Sort for consistent lookup
        "last_message": last_message,
        "updated_at": datetime.now()
    }
