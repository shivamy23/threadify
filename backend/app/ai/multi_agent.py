import re
from typing import Dict

# Multi-Agent AI Moderation System

PROFANITY_WORDS = ["fuck", "shit", "damn", "bitch", "ass", "bastard", "crap", "piss"]
HATE_KEYWORDS = ["hate", "kill", "die", "stupid", "idiot", "retard", "nazi", "terrorist"]
SENSITIVE_PATTERNS = {
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
    "credit_card": r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
}

def profanity_detector(text: str) -> str:
    """Agent 1: Detect profanity"""
    text_lower = text.lower()
    count = sum(1 for word in PROFANITY_WORDS if word in text_lower)
    
    if count >= 3:
        return "HIGH"
    elif count >= 1:
        return "MEDIUM"
    return "LOW"

def hate_speech_classifier(text: str) -> str:
    """Agent 2: Classify hate speech"""
    text_lower = text.lower()
    count = sum(1 for word in HATE_KEYWORDS if word in text_lower)
    
    if count >= 3:
        return "HIGH"
    elif count >= 1:
        return "MEDIUM"
    return "LOW"

def sensitive_info_detector(text: str) -> bool:
    """Agent 3: Detect sensitive information"""
    for pattern in SENSITIVE_PATTERNS.values():
        if re.search(pattern, text):
            return True
    return False

def context_validator(text: str) -> int:
    """Agent 4: Validate context quality (0-100)"""
    words = text.split()
    word_count = len(words)
    
    if word_count < 5:
        return 30
    elif word_count < 20:
        return 60
    elif word_count < 100:
        return 85
    return 95

def calculate_safety_score(profanity: str, hate_speech: str, sensitive: bool, context: int) -> int:
    """Calculate overall safety score (0-100)"""
    score = 100
    
    if profanity == "HIGH":
        score -= 40
    elif profanity == "MEDIUM":
        score -= 20
    
    if hate_speech == "HIGH":
        score -= 50
    elif hate_speech == "MEDIUM":
        score -= 25
    
    if sensitive:
        score -= 30
    
    score = max(0, min(100, score))
    return score

def multi_agent_moderate(text: str) -> Dict:
    """Run all 4 agents and return comprehensive moderation result"""
    profanity_risk = profanity_detector(text)
    hate_speech_risk = hate_speech_classifier(text)
    sensitive_info = sensitive_info_detector(text)
    context_score = context_validator(text)
    
    safety_score = calculate_safety_score(profanity_risk, hate_speech_risk, sensitive_info, context_score)
    
    if safety_score > 80:
        risk_level = "LOW"
    elif safety_score >= 50:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
    
    return {
        "profanity_risk": profanity_risk,
        "hate_speech_risk": hate_speech_risk,
        "sensitive_info_detected": sensitive_info,
        "context_score": context_score,
        "overall_safety_score": safety_score,
        "risk_level": risk_level
    }

def get_flag_explanation(moderation_result: Dict) -> str:
    """Generate human-readable explanation for flagged content"""
    reasons = []
    
    if moderation_result["profanity_risk"] in ["HIGH", "MEDIUM"]:
        reasons.append("contains profane language")
    
    if moderation_result["hate_speech_risk"] in ["HIGH", "MEDIUM"]:
        reasons.append("potential hate speech targeting protected groups")
    
    if moderation_result["sensitive_info_detected"]:
        reasons.append("contains sensitive personal information")
    
    if moderation_result["context_score"] < 50:
        reasons.append("lacks sufficient context")
    
    if not reasons:
        return "Content flagged for manual review"
    
    return f"This content was flagged due to: {', '.join(reasons)}."
