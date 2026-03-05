from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
import secrets
import hashlib
import re

from ..database import users_collection, otp_collection
from ..models.otp import OTPRequest, OTPVerify, otp_document
from ..models.user import user_document
from ..utils.email_service import email_service
from ..utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["OTP Auth"])

def generate_otp():
    """Generate 6-digit OTP"""
    return str(secrets.randbelow(900000) + 100000)

def hash_otp(otp: str):
    """Hash OTP using SHA256"""
    return hashlib.sha256(otp.encode()).hexdigest()

def validate_email(email: str):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def send_otp_background(email: str, otp: str):
    """Background task to send OTP email"""
    email_service.send_otp_email(email, otp)

@router.post("/request-otp")
def request_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    email = request.email.lower().strip()
    
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check rate limiting (1 OTP per 60 seconds)
    recent_otp = otp_collection.find_one({
        "email": email,
        "created_at": {"$gte": datetime.now().replace(second=0, microsecond=0)}
    })
    
    if recent_otp:
        raise HTTPException(status_code=429, detail="Please wait before requesting another OTP")
    
    # Generate and hash OTP
    otp = generate_otp()
    otp_hash = hash_otp(otp)
    
    # Delete any existing OTP for this email
    otp_collection.delete_many({"email": email})
    
    # Store new OTP
    otp_doc = otp_document(email, otp_hash)
    otp_collection.insert_one(otp_doc)
    
    # Send email in background
    background_tasks.add_task(send_otp_background, email, otp)
    
    return {"message": "OTP sent to email"}

@router.post("/verify-otp")
def verify_otp(request: OTPVerify):
    email = request.email.lower().strip()
    otp = request.otp.strip()
    
    if not validate_email(email) or len(otp) != 6 or not otp.isdigit():
        raise HTTPException(status_code=400, detail="Invalid email or OTP format")
    
    # Find OTP record
    otp_record = otp_collection.find_one({"email": email})
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Check expiration
    if datetime.now() > otp_record["expires_at"]:
        otp_collection.delete_one({"_id": otp_record["_id"]})
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Check attempt limit
    if otp_record["attempts"] >= 5:
        otp_collection.delete_one({"_id": otp_record["_id"]})
        raise HTTPException(status_code=400, detail="Too many attempts")
    
    # Verify OTP
    otp_hash = hash_otp(otp)
    if otp_hash != otp_record["otp_hash"]:
        # Increment attempts
        otp_collection.update_one(
            {"_id": otp_record["_id"]},
            {"$inc": {"attempts": 1}}
        )
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # OTP is valid - delete it
    otp_collection.delete_one({"_id": otp_record["_id"]})
    
    # Check if user exists
    user = users_collection.find_one({"email": email})
    
    if not user:
        # Create new user
        username = email.split("@")[0].lower()
        
        # Ensure unique username
        counter = 1
        original_username = username
        while users_collection.find_one({"username": username}):
            username = f"{original_username}{counter}"
            counter += 1
        
        new_user = user_document(
            username=username,
            email=email,
            hashed_password=""  # No password needed
        )
        new_user["verified"] = True
        
        result = users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Generate JWT
        token = create_access_token({
            "user_id": user_id,
            "email": email,
            "username": username
        })
        
        return {
            "message": "Account created and logged in",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "is_new_user": True
            }
        }
    
    else:
        # Existing user - login
        user_id = str(user["_id"])
        
        # Mark as verified
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"verified": True}}
        )
        
        # Generate JWT
        token = create_access_token({
            "user_id": user_id,
            "email": email,
            "username": user["username"]
        })
        
        return {
            "message": "Logged in successfully",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "username": user["username"],
                "email": email,
                "is_new_user": False
            }
        }

@router.post("/resend-otp")
def resend_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    """Resend OTP with same rate limiting"""
    return request_otp(request, background_tasks)