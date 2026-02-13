from fastapi import APIRouter, HTTPException
from ..database import users_collection
from ..models.user import user_document
from ..utils.security import hash_password, verify_password
from ..utils.jwt import create_access_token
from ..models.auth import UserAuth

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup")
def signup(user: UserAuth):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(user.password)

    new_user = user_document(
        email=user.email,
        hashed_password=hashed_password
    )

    users_collection.insert_one(new_user)

    return {"message": "User registered successfully"}



@router.post("/login")
def login(user: UserAuth):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "user_id": str(db_user["_id"]),
        "email": db_user["email"]
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }

