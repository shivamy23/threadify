"""
Email Configuration Test Script
Run this to verify your email setup is working correctly.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from app.utils.email_service import email_service

# Load environment variables
load_dotenv()

def test_email_configuration():
    """Test email configuration and credentials"""
    print("=" * 60)
    print("📧 THREADIFY EMAIL CONFIGURATION TEST")
    print("=" * 60)
    print()
    
    # Check environment variables
    print("1️⃣ Checking environment variables...")
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    
    if not email_user:
        print("   ❌ EMAIL_USER not set")
        print("   → Add EMAIL_USER=your-email@gmail.com to .env file")
        return False
    else:
        print(f"   ✅ EMAIL_USER: {email_user}")
    
    if not email_password:
        print("   ❌ EMAIL_PASSWORD not set")
        print("   → Add EMAIL_PASSWORD=your-app-password to .env file")
        print("   → Use Gmail App Password, not regular password")
        print("   → Generate at: https://myaccount.google.com/apppasswords")
        return False
    else:
        print(f"   ✅ EMAIL_PASSWORD: {'*' * len(email_password)} (hidden)")
    
    print(f"   ✅ SMTP_SERVER: {smtp_server}")
    print(f"   ✅ SMTP_PORT: {smtp_port}")
    print()
    
    # Test email sending
    print("2️⃣ Testing email sending...")
    print(f"   Sending test email to: {email_user}")
    print()
    
    test_otp = "123456"
    success = email_service.send_password_reset_otp(email_user, test_otp)
    
    if success:
        print("   ✅ EMAIL SENT SUCCESSFULLY!")
        print()
        print("   📬 Check your inbox for test email")
        print(f"   Subject: 'Threadify Password Reset Code'")
        print(f"   OTP Code: {test_otp}")
        print()
        print("=" * 60)
        print("✅ EMAIL CONFIGURATION IS WORKING!")
        print("=" * 60)
        return True
    else:
        print("   ❌ EMAIL SENDING FAILED")
        print()
        print("   Common issues:")
        print("   1. Using regular Gmail password instead of App Password")
        print("   2. 2-Step Verification not enabled")
        print("   3. App Password has spaces (remove them)")
        print("   4. Wrong email address")
        print()
        print("   📖 See EMAIL_SETUP_GUIDE.md for detailed instructions")
        print()
        print("=" * 60)
        print("❌ EMAIL CONFIGURATION FAILED")
        print("=" * 60)
        return False

if __name__ == "__main__":
    try:
        success = test_email_configuration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n📖 See EMAIL_SETUP_GUIDE.md for help")
        sys.exit(1)
