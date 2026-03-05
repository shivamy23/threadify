from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets
import hashlib
import logging
from ..database import users_collection
from ..models.user import user_document
from ..utils.security import hash_password, verify_password
from ..utils.jwt import create_access_token
from ..models.auth import UserAuth
from ..models.loginauth import UserLogin
from ..utils.email_service import email_service
from ..utils.constants import (
    VERIFICATION_EXPIRY_HOURS,
    MIN_PASSWORD_LENGTH,
    MIN_USERNAME_LENGTH,
    MAX_USERNAME_LENGTH
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

class ResendVerification(BaseModel):
    email: str


def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def send_verification_email(email: str, token: str) -> bool:
    """Send verification email with link"""
    verification_link = f"http://localhost:5173/verify-email?token={token}"
    success = email_service.send_verification_email(email, verification_link)
    
    if not success:
        logger.error(f"Failed to send verification email to {email}")
    
    return success


@router.post("/signup/")
def signup(user: UserAuth):
    email_lower = user.email.lower()
    
    existing_user = users_collection.find_one({"email": email_lower})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    existing_username = users_collection.find_one({"username": {"$regex": f"^{user.username}$", "$options": "i"}})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    import re
    if not re.match(r'^[a-zA-Z0-9_]+$', user.username):
        raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, and underscores")
    
    if len(user.username) < MIN_USERNAME_LENGTH or len(user.username) > MAX_USERNAME_LENGTH:
        raise HTTPException(status_code=400, detail=f"Username must be between {MIN_USERNAME_LENGTH} and {MAX_USERNAME_LENGTH} characters")

    hashed_password = hash_password(user.password)
    
    # Generate verification token
    verification_token = generate_verification_token()
    token_hash = hash_token(verification_token)
    expires_at = datetime.now() + timedelta(hours=VERIFICATION_EXPIRY_HOURS)

    new_user = user_document(
        username=user.username.lower(),
        email=email_lower,
        hashed_password=hashed_password
    )
    
    new_user["verification_token_hash"] = token_hash
    new_user["verification_expires_at"] = expires_at

    users_collection.insert_one(new_user)
    
    # Send verification email
    email_sent = send_verification_email(email_lower, verification_token)
    
    if not email_sent:
        # Still allow signup but warn user
        logger.warning(f"Verification email failed for {email_lower}")
        return {"message": "Account created but verification email failed. Please contact support."}

    return {"message": "Verification email sent. Please check your inbox."}




@router.post("/login/")
def login(user: UserLogin):
    identifier_lower = user.identifier.lower()
    
    db_user = users_collection.find_one({
        "$or": [
            {"email": identifier_lower},
            {"username": identifier_lower}
        ]
    })

    if not db_user:
        raise HTTPException(status_code=404, detail="Email not registered.")
    
    if not db_user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in.")

    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    token = create_access_token({
        "sub": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"]
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/verify-email")
def verify_email(token: str):
    token_hash = hash_token(token)
    
    user = users_collection.find_one({
        "verification_token_hash": token_hash,
        "verification_expires_at": {"$gt": datetime.now()}
    })
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"is_verified": True},
            "$unset": {"verification_token_hash": "", "verification_expires_at": ""}
        }
    )
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification(data: ResendVerification):
    email_lower = data.email.lower()
    
    user = users_collection.find_one({"email": email_lower})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a verification link has been sent."}
    
    if user.get("is_verified", False):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new token
    verification_token = generate_verification_token()
    token_hash = hash_token(verification_token)
    expires_at = datetime.now() + timedelta(hours=VERIFICATION_EXPIRY_HOURS)
    
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "verification_token_hash": token_hash,
                "verification_expires_at": expires_at
            }
        }
    )
    
    email_sent = send_verification_email(email_lower, verification_token)
    
    if not email_sent:
        logger.warning(f"Resend verification email failed for {email_lower}")
    
    return {"message": "If the email exists, a verification link has been sent."}