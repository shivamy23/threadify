from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from ..database import communities_collection, posts_collection, users_collection
from ..models.community import CommunityCreate, community_document
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/communities", tags=["Communities"])

# GET ALL COMMUNITIES
@router.get("/")
def get_communities(include_mature: bool = False, current_user=Depends(get_current_user)):
    communities = []
    user_allows_mature = current_user.get("allow_mature_content", False)
    
    query = {}
    if not include_mature or not user_allows_mature:
        query["mature"] = {"$ne": True}
    
    for comm in communities_collection.find(query):
        # Count posts in this community
        posts_count = posts_collection.count_documents({"community_id": str(comm["_id"])})
        
        communities.append({
            "id": str(comm["_id"]),
            "name": comm["name"],
            "slug": comm.get("slug", ""),
            "description": comm["description"],
            "icon": comm.get("icon", "🏠"),
            "mature": comm.get("mature", False),
            "members_count": comm.get("members_count", 0),
            "posts_count": posts_count,
            "is_member": str(current_user["_id"]) in comm.get("members", []),
            "created_at": comm.get("created_at").isoformat() if comm.get("created_at") else None
        })
    
    return communities

# CREATE COMMUNITY
@router.post("/")
def create_community(
    community: CommunityCreate,
    current_user=Depends(get_current_user)
):
    # Check if community name already exists
    existing = communities_collection.find_one({"name": {"$regex": f"^{community.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Community name already exists")
    
    new_comm = community_document(
        name=community.name,
        description=community.description,
        icon=community.icon,
        topic=community.topic,
        type=community.type,
        mature=community.mature,
        created_by=str(current_user["_id"])
    )
    
    result = communities_collection.insert_one(new_comm)
    
    # Add to user's created_communities and joined_communities
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$addToSet": {
                "created_communities": str(result.inserted_id),
                "joined_communities": str(result.inserted_id)
            }
        }
    )
    
    return {
        "message": "Community created",
        "community_id": str(result.inserted_id),
        "slug": new_comm["slug"]
    }

# GET SINGLE COMMUNITY
@router.get("/{community_id}")
def get_community(community_id: str, current_user=Depends(get_current_user)):
    comm = communities_collection.find_one({"_id": ObjectId(community_id)})
    
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Check mature content access
    if comm.get("mature", False) and not current_user.get("allow_mature_content", False):
        raise HTTPException(status_code=403, detail="Mature content access not enabled")
    
    posts_count = posts_collection.count_documents({"community_id": community_id})
    
    return {
        "id": str(comm["_id"]),
        "name": comm["name"],
        "slug": comm.get("slug", ""),
        "description": comm["description"],
        "icon": comm.get("icon", "🏠"),
        "topic": comm.get("topic", "General"),
        "type": comm.get("type", "public"),
        "mature": comm.get("mature", False),
        "members_count": comm.get("members_count", 0),
        "posts_count": posts_count,
        "rules": comm.get("rules", []),
        "is_member": str(current_user["_id"]) in comm.get("members", []),
        "is_creator": comm.get("created_by") == str(current_user["_id"]),
        "created_at": comm.get("created_at").isoformat() if comm.get("created_at") else None
    }

# JOIN COMMUNITY
@router.post("/{community_id}/join")
def join_community(community_id: str, current_user=Depends(get_current_user)):
    comm = communities_collection.find_one({"_id": ObjectId(community_id)})
    
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    
    user_id = str(current_user["_id"])
    members = comm.get("members", [])
    
    # Prevent creator from leaving
    if comm.get("created_by") == user_id and user_id in members:
        raise HTTPException(status_code=400, detail="Community creator cannot leave")
    
    if user_id in members:
        # Leave
        communities_collection.update_one(
            {"_id": ObjectId(community_id)},
            {
                "$pull": {"members": user_id},
                "$inc": {"members_count": -1}
            }
        )
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$pull": {"joined_communities": community_id}}
        )
        return {"message": "Left community"}
    else:
        # Join
        communities_collection.update_one(
            {"_id": ObjectId(community_id)},
            {
                "$addToSet": {"members": user_id},
                "$inc": {"members_count": 1}
            }
        )
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$addToSet": {"joined_communities": community_id}}
        )
        return {"message": "Joined community"}

# GET COMMUNITY POSTS
@router.get("/{community_id}/posts")
def get_community_posts(
    community_id: str,
    sort: str = "new",
    page: int = 1,
    limit: int = 10,
    current_user=Depends(get_current_user)
):
    skip = (page - 1) * limit
    posts = []
    
    # Sorting
    sort_order = [("created_at", -1)]
    if sort == "top":
        sort_order = [("likes", -1), ("created_at", -1)]
    elif sort == "comments":
        sort_order = [("comments_count", -1), ("created_at", -1)]
    
    for post in posts_collection.find({"community_id": community_id}).sort(sort_order).skip(skip).limit(limit):
        user = users_collection.find_one({"_id": ObjectId(post["author_id"])})
        username = user["username"] if user else "Unknown"
        
        likes_list = post.get("likes", [])
        
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "content_type": post.get("content_type", "text"),
            "image_url": post.get("image_url"),
            "video_url": post.get("video_url"),
            "author_id": post["author_id"],
            "username": username,
            "likes_count": len(likes_list),
            "liked_by_me": str(current_user["_id"]) in likes_list,
            "saved_by_me": False,
            "comments_count": post.get("comments_count", 0),
            "topic": post.get("topic", "General"),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    
    return {
        "page": page,
        "limit": limit,
        "results": posts
    }

# GET COMMUNITY BY SLUG (Reddit-style t/slug)
@router.get("/slug/{slug}")
def get_community_by_slug(slug: str, current_user=Depends(get_current_user)):
    comm = communities_collection.find_one({"slug": slug})
    
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Check mature content access
    if comm.get("mature", False) and not current_user.get("allow_mature_content", False):
        raise HTTPException(status_code=403, detail="Mature content access not enabled")
    
    posts_count = posts_collection.count_documents({"community_id": str(comm["_id"])})
    
    return {
        "id": str(comm["_id"]),
        "name": comm["name"],
        "slug": comm.get("slug", ""),
        "description": comm["description"],
        "icon": comm.get("icon", "🏠"),
        "topic": comm.get("topic", "General"),
        "type": comm.get("type", "public"),
        "mature": comm.get("mature", False),
        "members_count": comm.get("members_count", 0),
        "posts_count": posts_count,
        "rules": comm.get("rules", []),
        "is_member": str(current_user["_id"]) in comm.get("members", []),
        "is_creator": comm.get("created_by") == str(current_user["_id"]),
        "created_at": comm.get("created_at").isoformat() if comm.get("created_at") else None
    }
