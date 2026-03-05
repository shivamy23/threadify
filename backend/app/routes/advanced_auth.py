from fastapi import APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel
import secrets

from ..database import (
    users_collection, 
    refresh_tokens_collection, 
    password_reset_tokens_collection
)
from ..models.password_auth import UserSignup, UserLogin
from ..models.refresh_token import (
    RefreshTokenCreate, 
    refresh_token_document, 
    password_reset_token_document,
    generate_secure_token,
    hash_token
)
from ..models.user import user_document
from ..utils.security import hash_password, verify_password
from ..utils.jwt import create_access_token, create_refresh_token_expiry
from ..utils.email_service import email_service
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Advanced Auth"])
security = HTTPBearer()

class LoginRequest(UserLogin):
    remember_me: bool = False

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class AccountDeleteRequest(BaseModel):
    password: str

def send_password_reset_email(email: str, token: str):
    """Send password reset email"""
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    subject = "Reset Your Threadify Password"
    body = f"""
    You requested a password reset for your Threadify account.
    
    Click the link below to reset your password:
    {reset_link}
    
    This link will expire in 15 minutes.
    
    If you didn't request this, please ignore this email.
    
    - Threadify Team
    """
    
    try:
        email_service.send_email(email, subject, body)
        return True
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        return False

@router.post("/signup")
def signup(user_data: UserSignup, response: Response):
    # Check uniqueness
    if users_collection.find_one({"username": {"$regex": f"^{user_data.username}$", "$options": "i"}}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if users_collection.find_one({"email": user_data.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    new_user = user_document(user_data.username, user_data.email, hashed_password)
    result = users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Generate tokens
    access_token = create_access_token({
        "sub": user_id,
        "username": user_data.username,
        "email": user_data.email
    })
    
    # Generate refresh token (default 7 days for signup)
    refresh_token = generate_secure_token()
    refresh_token_hash = hash_token(refresh_token)
    expires_at = create_refresh_token_expiry(remember_me=False)
    
    # Store refresh token
    refresh_doc = refresh_token_document(user_id, refresh_token_hash, expires_at)
    refresh_tokens_collection.insert_one(refresh_doc)
    
    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days in seconds
    )
    
    return {
        "message": "Account created successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "display_name": user_data.username
        }
    }

@router.post("/login")
def login(credentials: LoginRequest, response: Response):
    # Find user
    user = users_collection.find_one({"email": credentials.email.lower()})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if account is deleted
    if user.get("is_deleted", False):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    
    # Generate tokens
    access_token = create_access_token({
        "sub": user_id,
        "username": user["username"],
        "email": user["email"]
    })
    
    # Generate refresh token
    refresh_token = generate_secure_token()
    refresh_token_hash = hash_token(refresh_token)
    expires_at = create_refresh_token_expiry(credentials.remember_me)
    
    # Store refresh token
    refresh_doc = refresh_token_document(user_id, refresh_token_hash, expires_at)
    refresh_tokens_collection.insert_one(refresh_doc)
    
    # Set refresh token cookie
    max_age = (30 if credentials.remember_me else 7) * 24 * 60 * 60
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="lax",
        max_age=max_age
    )
    
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "display_name": user.get("display_name", user["username"])
        }
    }

@router.post("/refresh")
def refresh_token(request: Request, response: Response):
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    
    # Hash and find token
    token_hash = hash_token(refresh_token)
    token_doc = refresh_tokens_collection.find_one({
        "token_hash": token_hash,
        "revoked": False,
        "expires_at": {"$gt": datetime.now()}
    })
    
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Get user
    user = users_collection.find_one({"_id": ObjectId(token_doc["user_id"])})
    if not user or user.get("is_deleted", False):
        raise HTTPException(status_code=401, detail="User not found")
    
    # Revoke old refresh token
    refresh_tokens_collection.update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"revoked": True}}
    )
    
    # Generate new tokens
    user_id = str(user["_id"])
    access_token = create_access_token({
        "sub": user_id,
        "username": user["username"],
        "email": user["email"]
    })
    
    # Generate new refresh token
    new_refresh_token = generate_secure_token()
    new_token_hash = hash_token(new_refresh_token)
    
    # Calculate expiry (maintain original remember_me duration)
    original_duration = token_doc["expires_at"] - token_doc["created_at"]
    new_expires_at = datetime.now() + original_duration
    
    # Store new refresh token
    new_refresh_doc = refresh_token_document(user_id, new_token_hash, new_expires_at)
    refresh_tokens_collection.insert_one(new_refresh_doc)
    
    # Set new refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=int(original_duration.total_seconds())
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(request: Request, response: Response):
    # Get and revoke refresh token
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token:
        token_hash = hash_token(refresh_token)
        refresh_tokens_collection.update_one(
            {"token_hash": token_hash},
            {"$set": {"revoked": True}}
        )
    
    # Clear cookie
    response.delete_cookie("refresh_token")
    
    return {"message": "Logged out successfully"}

@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    # Always return success to prevent email enumeration
    user = users_collection.find_one({"email": request.email.lower()})
    
    if user and not user.get("is_deleted", False):
        # Generate reset token
        reset_token = generate_secure_token()
        token_hash = hash_token(reset_token)
        
        # Delete existing reset tokens for this user
        password_reset_tokens_collection.delete_many({"user_id": str(user["_id"])})
        
        # Store reset token
        reset_doc = password_reset_token_document(str(user["_id"]), token_hash)
        password_reset_tokens_collection.insert_one(reset_doc)
        
        # Send email in background
        background_tasks.add_task(send_password_reset_email, request.email, reset_token)
    
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/reset-password")
def reset_password(request: PasswordResetConfirm):
    # Find and validate token
    token_hash = hash_token(request.token)
    reset_doc = password_reset_tokens_collection.find_one({
        "token_hash": token_hash,
        "used": False,
        "expires_at": {"$gt": datetime.now()}
    })
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Get user
    user = users_collection.find_one({"_id": ObjectId(reset_doc["user_id"])})
    if not user or user.get("is_deleted", False):
        raise HTTPException(status_code=400, detail="User not found")
    
    # Update password
    new_password_hash = hash_password(request.new_password)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.now()
            }
        }
    )
    
    # Mark token as used
    password_reset_tokens_collection.update_one(
        {"_id": reset_doc["_id"]},
        {"$set": {"used": True}}
    )
    
    # Revoke all refresh tokens for security
    refresh_tokens_collection.update_many(
        {"user_id": str(user["_id"])},
        {"$set": {"revoked": True}}
    )
    
    return {"message": "Password reset successfully"}

@router.delete("/account")
def delete_account(request: AccountDeleteRequest, current_user=Depends(get_current_user)):
    # Verify password
    if not verify_password(request.password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    user_id = str(current_user["_id"])
    
    # Soft delete user
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "is_deleted": True,
                "deleted_at": datetime.now(),
                "updated_at": datetime.now()
            }
        }
    )
    
    # Revoke all refresh tokens
    refresh_tokens_collection.update_many(
        {"user_id": user_id},
        {"$set": {"revoked": True}}
    )
    
    # Remove from followers/following relationships
    users_collection.update_many(
        {"followers": user_id},
        {"$pull": {"followers": user_id}, "$inc": {"followers_count": -1}}
    )
    
    users_collection.update_many(
        {"following": user_id},
        {"$pull": {"following": user_id}, "$inc": {"following_count": -1}}
    )
    
    return {"message": "Account deleted successfully"}