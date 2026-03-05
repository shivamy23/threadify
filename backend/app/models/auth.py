from pydantic import BaseModel, EmailStr, field_validator
import re

class UserAuth(BaseModel):
    username: str
    email: EmailStr
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        email = v.lower()
        
        # Strict regex for public email domains
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|me|info|app|dev|tech|ai)$'
        
        if not re.match(pattern, email):
            raise ValueError('Please enter a valid public email address.')
        
        # Reject common fake/test domains
        blocked_domains = ['example.com', 'test.com', 'localhost', 'domain.local']
        domain = email.split('@')[1]
        
        if domain in blocked_domains:
            raise ValueError('Please enter a valid public email address.')
        
        return email
