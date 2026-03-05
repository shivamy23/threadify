from fastapi import APIRouter, HTTPException
from datetime import datetime

from ..database import users_collection
from ..models.password_auth import UserSignup, UserLogin
from ..models.user import user_document
from ..utils.security import hash_password, verify_password
from ..utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Password Auth"])

@router.post("/signup")
def signup(user_data: UserSignup):
    # Check if username exists (case insensitive)
    existing_username = users_collection.find_one({
        "username": {"$regex": f"^{user_data.username}$", "$options": "i"}
    })
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    existing_email = users_collection.find_one({"email": user_data.email.lower()})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user document
    new_user = user_document(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    
    # Insert user
    result = users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Generate JWT token
    token = create_access_token({
        "sub": user_id,
        "username": user_data.username,
        "email": user_data.email
    })
    
    return {
        "message": "Account created successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "display_name": user_data.username
        }
    }

@router.post("/login")
def login(credentials: UserLogin):
    # Find user by email
    user = users_collection.find_one({"email": credentials.email.lower()})
    
    # Generic error message for security
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate JWT token
    token = create_access_token({
        "sub": str(user["_id"]),
        "username": user["username"],
        "email": user["email"]
    })
    
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "display_name": user.get("display_name", user["username"])
        }
    }