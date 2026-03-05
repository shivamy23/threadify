from datetime import datetime


def user_document(username: str, email: str, hashed_password: str):
    return {
        "username": username.lower(),
        "email": email.lower(),
        "password_hash": hashed_password,

        # Role & Status
        "role": "user",
        "is_active": True,
        "is_verified": False,
        "verification_token_hash": None,
        "verification_expires_at": None,

        # Profile Fields
        "display_name": username,
        "bio": "",
        "avatar": "",
        "banner": "",
        "location": "",

        # Preferences
        "allow_mature_content": False,

        # Social Graph
        "followers": [],
        "following": [],
        "followers_count": 0,
        "following_count": 0,

        # Communities
        "joined_communities": [],
        "created_communities": [],

        # Stats
        "posts_count": 0,
        "comments_count": 0,
        "karma": 0,
        
        # AI Risk Profiling
        "risk_score": 0,
        "reputation_score": 100,
        "flagged_posts_count": 0,
        "redacted_posts_count": 0,
        "reports_received": 0,

        # Metadata
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
