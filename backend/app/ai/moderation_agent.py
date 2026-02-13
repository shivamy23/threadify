from .moderation_model import analyze_text
from .redactor import redact_sensitive_content

TOXIC_THRESHOLD = 0.80

def moderate_content(text: str):
    analysis = analyze_text(text)

    flagged = False
    redacted_text = text

    if analysis["label"] == "toxic" and analysis["score"] > TOXIC_THRESHOLD:
        flagged = True

    # Always run redaction for PII
    redacted_text = redact_sensitive_content(text)

    return {
        "flagged": flagged,
        "analysis": analysis,
        "content": redacted_text
    }
