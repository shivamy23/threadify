TOPIC_KEYWORDS = {
    "Tech": ["code", "programming", "software", "developer", "tech", "ai", "ml", "data", "algorithm", "api", "bug", "github"],
    "Education": ["learn", "study", "course", "tutorial", "education", "school", "university", "teach", "student", "exam"],
    "Politics": ["government", "election", "vote", "policy", "law", "congress", "president", "political", "democracy"],
    "Health": ["health", "medical", "doctor", "hospital", "medicine", "fitness", "workout", "diet", "mental", "therapy"],
    "Entertainment": ["movie", "music", "game", "gaming", "film", "show", "series", "entertainment", "fun", "play"],
    "Business": ["business", "startup", "entrepreneur", "company", "market", "finance", "investment", "economy", "trade"],
    "Science": ["science", "research", "study", "experiment", "discovery", "physics", "chemistry", "biology", "space"],
    "Sports": ["sport", "game", "team", "player", "match", "football", "basketball", "soccer", "baseball", "athlete"],
    "Art": ["art", "design", "creative", "painting", "drawing", "artist", "gallery", "exhibition", "photography"],
    "Food": ["food", "recipe", "cooking", "restaurant", "chef", "meal", "dish", "cuisine", "eat", "taste"]
}

def classify_topic(text: str) -> str:
    """Classify post topic based on content"""
    text_lower = text.lower()
    scores = {}
    
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        scores[topic] = score
    
    if max(scores.values()) == 0:
        return "General"
    
    return max(scores, key=scores.get)
