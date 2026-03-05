from datetime import datetime, timedelta
from pydantic import BaseModel

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

def otp_document(email: str, otp_hash: str):
    return {
        "email": email,
        "otp_hash": otp_hash,
        "expires_at": datetime.now() + timedelta(minutes=5),
        "attempts": 0,
        "created_at": datetime.now()
    }