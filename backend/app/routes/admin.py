from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from ..database import posts_collection, users_collection
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user=Depends(get_current_user)):
    """Dependency to ensure user is admin"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ---------------------------
# MODERATION DASHBOARD
# ---------------------------
@router.get("/dashboard/")
def get_moderation_dashboard(current_user=Depends(require_admin)):
    """Get comprehensive moderation dashboard data"""
    
    # Total flagged posts
    total_flagged = posts_collection.count_documents({"flagged": True})
    
    # Total posts
    total_posts = posts_collection.count_documents({})
    
    # Daily toxicity percentage
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_posts = posts_collection.count_documents({"created_at": {"$gte": today}})
    today_flagged = posts_collection.count_documents({
        "created_at": {"$gte": today},
        "flagged": True
    })
    daily_toxicity = (today_flagged / today_posts * 100) if today_posts > 0 else 0
    
    # Redacted posts count
    total_redacted = posts_collection.count_documents({"redacted": True})
    
    # Average safety score
    pipeline = [
        {"$group": {"_id": None, "avg_safety": {"$avg": "$safety_score"}}}
    ]
    avg_result = list(posts_collection.aggregate(pipeline))
    avg_safety_score = avg_result[0]["avg_safety"] if avg_result else 100
    
    # User risk distribution
    high_risk_users = users_collection.count_documents({"risk_score": {"$gte": 50}})
    medium_risk_users = users_collection.count_documents({
        "risk_score": {"$gte": 20, "$lt": 50}
    })
    low_risk_users = users_collection.count_documents({"risk_score": {"$lt": 20}})
    
    return {
        "total_posts": total_posts,
        "total_flagged": total_flagged,
        "total_redacted": total_redacted,
        "daily_toxicity_percentage": round(daily_toxicity, 2),
        "average_safety_score": round(avg_safety_score, 2),
        "user_risk_distribution": {
            "high_risk": high_risk_users,
            "medium_risk": medium_risk_users,
            "low_risk": low_risk_users
        }
    }


# ---------------------------
# TOXICITY ANALYTICS
# ---------------------------
@router.get("/analytics/toxicity/")
def get_toxicity_analytics(
    days: int = 7,
    current_user=Depends(require_admin)
):
    """Get toxicity trends over time"""
    
    analytics = []
    
    for i in range(days):
        date = datetime.now() - timedelta(days=i)
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        total = posts_collection.count_documents({
            "created_at": {"$gte": start_of_day, "$lt": end_of_day}
        })
        
        flagged = posts_collection.count_documents({
            "created_at": {"$gte": start_of_day, "$lt": end_of_day},
            "flagged": True
        })
        
        redacted = posts_collection.count_documents({
            "created_at": {"$gte": start_of_day, "$lt": end_of_day},
            "redacted": True
        })
        
        hate_speech = posts_collection.count_documents({
            "created_at": {"$gte": start_of_day, "$lt": end_of_day},
            "moderation_result.hate_speech_risk": {"$in": ["HIGH", "MEDIUM"]}
        })
        
        analytics.append({
            "date": start_of_day.strftime("%Y-%m-%d"),
            "total_posts": total,
            "toxic_posts": flagged,
            "redacted_posts": redacted,
            "hate_speech_posts": hate_speech,
            "toxicity_rate": round((flagged / total * 100) if total > 0 else 0, 2)
        })
    
    return {
        "period_days": days,
        "analytics": list(reversed(analytics))
    }


# ---------------------------
# TOP FLAGGED KEYWORDS
# ---------------------------
@router.get("/analytics/keywords/")
def get_flagged_keywords(current_user=Depends(require_admin)):
    """Get most common keywords in flagged posts"""
    
    # Simple keyword extraction from flagged posts
    flagged_posts = list(posts_collection.find(
        {"flagged": True},
        {"content": 1, "title": 1}
    ).limit(100))
    
    word_freq = {}
    
    for post in flagged_posts:
        text = f"{post.get('title', '')} {post.get('content', '')}".lower()
        words = text.split()
        
        for word in words:
            if len(word) > 3:  # Skip short words
                word_freq[word] = word_freq.get(word, 0) + 1
    
    # Get top 20
    top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20]
    
    return {
        "keywords": [{"word": word, "count": count} for word, count in top_keywords]
    }


# ---------------------------
# HIGH RISK USERS
# ---------------------------
@router.get("/users/high-risk/")
def get_high_risk_users(
    limit: int = 20,
    current_user=Depends(require_admin)
):
    """Get users with high risk scores"""
    
    users = []
    
    for user in users_collection.find(
        {"risk_score": {"$gte": 30}}
    ).sort("risk_score", -1).limit(limit):
        
        users.append({
            "user_id": str(user["_id"]),
            "username": user["username"],
            "risk_score": user.get("risk_score", 0),
            "reputation_score": user.get("reputation_score", 100),
            "posts_count": user.get("posts_count", 0),
            "flagged_posts_count": user.get("flagged_posts_count", 0),
            "redacted_posts_count": user.get("redacted_posts_count", 0),
            "reports_received": user.get("reports_received", 0)
        })
    
    return {"users": users}


# ---------------------------
# TOPIC DISTRIBUTION
# ---------------------------
@router.get("/analytics/topics/")
def get_topic_distribution(current_user=Depends(require_admin)):
    """Get distribution of posts by topic"""
    
    pipeline = [
        {"$group": {"_id": "$topic", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    results = list(posts_collection.aggregate(pipeline))
    
    topics = [{"topic": r["_id"], "count": r["count"]} for r in results]
    
    return {"topics": topics}
