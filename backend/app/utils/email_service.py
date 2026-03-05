import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email = os.getenv("EMAIL_USER")
        self.password = os.getenv("EMAIL_PASSWORD")
        
        if not self.email or not self.password:
            logger.warning("Email credentials not configured. Email sending will fail.")
    
    def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Internal method to send email via SMTP"""
        if not self.email or not self.password:
            logger.error("Email credentials not configured")
            print("❌ Email credentials missing:")
            print(f"   EMAIL_USER: {self.email}")
            print(f"   EMAIL_PASSWORD: {'SET' if self.password else 'NOT SET'}")
            return False
        
        try:
            print(f"📧 Connecting to SMTP server: {self.smtp_server}:{self.smtp_port}")
            
            msg = MIMEMultipart()
            msg['From'] = self.email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            print(f"   From: {self.email}")
            print(f"   To: {to_email}")
            print(f"   Subject: {subject}")
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                print("   Starting TLS...")
                server.starttls()
                
                print("   Logging in...")
                server.login(self.email, self.password)
                
                print("   Sending message...")
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            print(f"✅ Email sent successfully!")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            print(f"❌ SMTP Authentication Failed!")
            print(f"   Error: {e}")
            print("   Solution:")
            print("   1. Use Gmail App Password (not regular password)")
            print("   2. Enable 2-Step Verification")
            print("   3. Generate App Password at: https://myaccount.google.com/apppasswords")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            print(f"❌ SMTP Error: {e}")
            return False
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            print(f"❌ Email sending failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def send_password_reset_otp(self, to_email: str, otp: str) -> bool:
        """Send password reset OTP email"""
        subject = "Threadify Password Reset Code"
        body = f"""Hello,

Your password reset code is: {otp}

This code will expire in 10 minutes.
Do not share this code with anyone.

If you didn't request this, please ignore this email.

- Threadify Team"""
        
        return self._send_email(to_email, subject, body)
    
    def send_verification_email(self, to_email: str, verification_link: str) -> bool:
        """Send email verification link"""
        subject = "Verify Your Threadify Account"
        body = f"""Welcome to Threadify!

Please verify your email address by clicking the link below:

{verification_link}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

- Threadify Team"""
        
        return self._send_email(to_email, subject, body)
    
    def send_otp_email(self, to_email: str, otp: str) -> bool:
        """Send generic OTP email (for backward compatibility)"""
        subject = "Your Threadify Verification Code"
        body = f"""Hello,

Your verification code is: {otp}

This code will expire in 5 minutes.
Do not share this code with anyone.

- Threadify Team"""
        
        return self._send_email(to_email, subject, body)

email_service = EmailService()