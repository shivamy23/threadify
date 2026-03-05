from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from ..database import users_collection, posts_collection, communities_collection
from ..utils.dependencies import get_current_user
import re

router = APIRouter(prefix="/search", tags=["Search"])

def sanitize_query(query: str) -> str:
    """Sanitize search query to prevent regex injection"""
    return re.escape(query.strip())

@router.get("/")
def global_search(
    q: str = Query(..., min_length=2, max_length=100),
    current_user=Depends(get_current_user)
):
    """Global search across users, communities, and posts"""
    
    sanitized_query = sanitize_query(q)
    regex_pattern = {"$regex": sanitized_query, "$options": "i"}
    
    # Search Users
    users = []
    for user in users_collection.find(
        {"$or": [
            {"username": regex_pattern},
            {"bio": regex_pattern}
        ]}
    ).limit(5):
        users.append({
            "id": str(user["_id"]),
            "username": user["username"],
            "bio": user.get("bio", ""),
            "slug": user["username"],
            "type": "user"
        })
    
    # Search Communities
    communities = []
    for community in communities_collection.find(
        {"$or": [
            {"name": regex_pattern},
            {"description": regex_pattern}
        ]}
    ).limit(5):
        communities.append({
            "id": str(community["_id"]),
            "name": community["name"],
            "description": community.get("description", ""),
            "slug": community.get("slug", community["name"].lower()),
            "members_count": community.get("members_count", 0),
            "type": "community"
        })
    
    # Search Posts
    posts = []
    for post in posts_collection.find(
        {"$or": [
            {"title": regex_pattern},
            {"content": regex_pattern}
        ]}
    ).sort("created_at", -1).limit(5):
        # Get author username
        author = users_collection.find_one({"_id": ObjectId(post["author_id"])})
        username = author["username"] if author else "Unknown"
        
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post.get("content", "")[:100],
            "author_username": username,
            "likes_count": len(post.get("likes", [])),
            "comments_count": post.get("comments_count", 0),
            "type": "post"
        })
    
    return {
        "query": q,
        "users": users,
        "communities": communities,
        "posts": posts,
        "total": len(users) + len(communities) + len(posts)
    }
