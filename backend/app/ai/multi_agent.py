import os
from typing import Dict
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

# Initialize the AI Client
client = InferenceClient(api_key=os.getenv("HF_API_TOKEN"))

def profanity_detector(text: str) -> str:
    """Agent 1: Uses AI to detect toxic/profane language"""
    try:
        result = client.text_classification(text, model="original-v6/toxic-bert")
        toxic_score = next((item['score'] for item in result if item['label'] == 'toxic'), 0)
        if toxic_score > 0.8: return "HIGH"
        if toxic_score > 0.4: return "MEDIUM"
    except Exception:
        pass # Fallback if API fails
    return "LOW"

def hate_speech_classifier(text: str) -> str:
    """Agent 2: Checks for hate speech"""
    try:
        result = client.text_classification(text, model="facebook/roberta-hate-speech-dynabench-r4-target")
        hate_label = max(result, key=lambda x: x['score'])
        if hate_label['label'] == 'hate' and hate_label['score'] > 0.7:
            return "HIGH"
        elif hate_label['label'] == 'hate':
            return "MEDIUM"
    except Exception:
        pass
    return "LOW"

def sensitive_info_detector(text: str) -> bool:
    """Agent 3: Uses NER to find PII"""
    try:
        entities = client.token_classification(text, model="dbmdz/bert-large-cased-finetuned-conll03-english")
        return len(entities) > 0
    except Exception:
        return False

def context_validator(text: str) -> int:
    """Agent 4: Checks quality score"""
    words = text.split()
    if len(words) < 5: return 30
    return 90

def calculate_safety_score(profanity: str, hate_speech: str, sensitive: bool, context: int) -> int:
    score = 100
    if profanity == "HIGH": score -= 40
    elif profanity == "MEDIUM": score -= 20
    if hate_speech == "HIGH": score -= 50
    elif hate_speech == "MEDIUM": score -= 25
    if sensitive: score -= 30
    return max(0, min(100, score))

def multi_agent_moderate(text: str) -> Dict:
    profanity_risk = profanity_detector(text)
    hate_speech_risk = hate_speech_classifier(text)
    sensitive_info = sensitive_info_detector(text)
    context_score = context_validator(text)
    
    safety_score = calculate_safety_score(profanity_risk, hate_speech_risk, sensitive_info, context_score)
    
    return {
        "profanity_risk": profanity_risk,
        "hate_speech_risk": hate_speech_risk,
        "sensitive_info_detected": sensitive_info,
        "context_score": context_score,
        "overall_safety_score": safety_score,
        "risk_level": "LOW" if safety_score > 80 else "MEDIUM" if safety_score >= 50 else "HIGH"
    }

# --- THIS IS THE MISSING FUNCTION THAT CAUSED YOUR ERROR ---
def get_flag_explanation(moderation_result: Dict) -> str:
    """Generate human-readable explanation for flagged content"""
    reasons = []
    
    if moderation_result["profanity_risk"] in ["HIGH", "MEDIUM"]:
        reasons.append("profane language detected by AI")
    
    if moderation_result["hate_speech_risk"] in ["HIGH", "MEDIUM"]:
        reasons.append("potential hate speech")
    
    if moderation_result["sensitive_info_detected"]:
        reasons.append("contains sensitive personal information (PII)")
    
    if moderation_result["context_score"] < 50:
        reasons.append("low quality or insufficient context")
    
    if not reasons:
        return "Content flagged for manual review."
    
    return f"This content was flagged because: {', '.join(reasons)}."