import re

def redact_sensitive_content(text: str):
    """Context-aware redaction of sensitive information"""
    redacted = text
    redacted_count = 0
    
    # Redact email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    if re.search(email_pattern, redacted):
        redacted = re.sub(email_pattern, '**********', redacted)
        redacted_count += 1
    
    # Redact phone numbers
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    if re.search(phone_pattern, redacted):
        redacted = re.sub(phone_pattern, '**********', redacted)
        redacted_count += 1
    
    # Redact SSN
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    if re.search(ssn_pattern, redacted):
        redacted = re.sub(ssn_pattern, '**********', redacted)
        redacted_count += 1
    
    # Redact credit cards
    cc_pattern = r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
    if re.search(cc_pattern, redacted):
        redacted = re.sub(cc_pattern, '**********', redacted)
        redacted_count += 1
    
    return {
        "text": redacted,
        "redacted": redacted_count > 0,
        "redaction_count": redacted_count
    }
