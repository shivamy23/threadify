from datetime import datetime, timedelta
from pydantic import BaseModel
import secrets
import hashlib

class RefreshTokenCreate(BaseModel):
    remember_me: bool = False

def refresh_token_document(user_id: str, token_hash: str, expires_at: datetime, device_info: str = None):
    return {
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "created_at": datetime.now(),
        "revoked": False,
        "device_info": device_info
    }

def password_reset_token_document(user_id: str, token_hash: str):
    return {
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": datetime.now() + timedelta(minutes=15),
        "created_at": datetime.now(),
        "used": False
    }

def generate_secure_token():
    """Generate cryptographically secure random token"""
    return secrets.token_urlsafe(32)

def hash_token(token: str):
    """Hash token using SHA256"""
    return hashlib.sha256(token.encode()).hexdigest()