from datetime import datetime

def user_document(email: str, hashed_password: str):
    return {
        "email": email,
        "password": hashed_password,
        "role": "user",
        "is_active": True,
        "created_at": datetime.now()
    }
