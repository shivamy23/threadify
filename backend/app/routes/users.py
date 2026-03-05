from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel

from ..database import users_collection, posts_collection, communities_collection, saved_posts_collection, comments_collection
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

class UserSettings(BaseModel):
    allow_mature_content: bool

class ProfileUpdate(BaseModel):
    display_name: str = None
    bio: str = None
    avatar: str = None
    banner: str = None


# ---------------------------
# GET CURRENT USER SAVED POSTS
# ---------------------------
@router.get("/me/saved")
def get_my_saved_posts(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Get saved post IDs
    saved_posts = list(saved_posts_collection.find({"user_id": user_id}).sort("created_at", -1))
    
    if not saved_posts:
        return {"posts": []}
    
    # Get post details
    post_ids = [ObjectId(sp["post_id"]) for sp in saved_posts]
    posts = []
    
    for post in posts_collection.find({"_id": {"$in": post_ids}}):
        # Get author info
        author = users_collection.find_one({"_id": ObjectId(post["author_id"])})
        username = author["username"] if author else "Unknown"
        
        # Get community info if exists
        community_name = None
        community_slug = None
        if post.get("community_id"):
            comm = communities_collection.find_one({"_id": ObjectId(post["community_id"])})
            if comm:
                community_name = comm["name"]
                community_slug = comm.get("slug", "")
        
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
            "community_name": community_name,
            "community_slug": community_slug,
            "likes_count": len(likes_list),
            "liked_by_me": user_id in likes_list,
            "saved_by_me": True,
            "comments_count": post.get("comments_count", 0),
            "topic": post.get("topic", "General"),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    
    return {"posts": posts}


# ---------------------------
# GET CURRENT USER
# ---------------------------
@router.get("/me")
def get_current_user_profile(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "display_name": current_user.get("display_name", current_user["username"]),
        "bio": current_user.get("bio", ""),
        "avatar": current_user.get("avatar", ""),
        "created_at": current_user.get("created_at").isoformat() if current_user.get("created_at") else None
    }


# ---------------------------
# GET USER PROFILE BY USERNAME
# ---------------------------
@router.get("/u/{username}")
def get_user_profile_by_username(username: str, current_user=Depends(get_current_user)):
    user = users_collection.find_one({"username": username})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_own_profile = str(current_user["_id"]) == str(user["_id"])
    is_following = str(current_user["_id"]) in user.get("followers", [])

    # Get user's communities
    joined_communities = []
    for comm_id in user.get("joined_communities", [])[:5]:
        comm = communities_collection.find_one({"_id": ObjectId(comm_id)})
        if comm:
            joined_communities.append({
                "id": str(comm["_id"]),
                "name": comm["name"],
                "slug": comm.get("slug", ""),
                "icon": comm.get("icon", "🏠")
            })

    profile_data = {
        "id": str(user["_id"]),
        "username": user["username"],
        "display_name": user.get("display_name", user["username"]),
        "bio": user.get("bio", ""),
        "avatar": user.get("avatar", ""),
        "banner": user.get("banner", ""),
        "followers_count": user.get("followers_count", len(user.get("followers", []))),
        "following_count": user.get("following_count", len(user.get("following", []))),
        "posts_count": user.get("posts_count", 0),
        "comments_count": user.get("comments_count", 0),
        "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
        "is_own_profile": is_own_profile,
        "is_following": is_following,
        "joined_communities": joined_communities
    }

    return profile_data


# ---------------------------
# GET USER POSTS
# ---------------------------
@router.get("/u/{username}/posts")
def get_user_posts(username: str, sort: str = "new", current_user=Depends(get_current_user)):
    user = users_collection.find_one({"username": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sort_order = [("created_at", -1)] if sort == "new" else [("likes", -1), ("created_at", -1)]
    
    posts = []
    for post in posts_collection.find({"author_id": str(user["_id"])}).sort(sort_order).limit(20):
        likes_list = post.get("likes", [])
        
        # Get community info if post is in a community
        community_name = None
        community_slug = None
        if post.get("community_id"):
            comm = communities_collection.find_one({"_id": ObjectId(post["community_id"])})
            if comm:
                community_name = comm["name"]
                community_slug = comm.get("slug", "")
        
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "content_type": post.get("content_type", "text"),
            "image_url": post.get("image_url"),
            "video_url": post.get("video_url"),
            "author_id": post["author_id"],
            "username": username,
            "community_name": community_name,
            "community_slug": community_slug,
            "likes_count": len(likes_list),
            "liked_by_me": str(current_user["_id"]) in likes_list,
            "saved_by_me": False,
            "comments_count": post.get("comments_count", 0),
            "topic": post.get("topic", "General"),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    
    return {"results": posts}


# ---------------------------
# FOLLOW USER
# ---------------------------
@router.post("/u/{username}/follow")
def follow_user(username: str, current_user=Depends(get_current_user)):
    target_user = users_collection.find_one({"username": username})
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_user_id = str(current_user["_id"])
    target_user_id = str(target_user["_id"])
    
    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if already following
    if current_user_id in target_user.get("followers", []):
        # Unfollow
        users_collection.update_one(
            {"_id": target_user["_id"]},
            {
                "$pull": {"followers": current_user_id},
                "$inc": {"followers_count": -1}
            }
        )
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {
                "$pull": {"following": target_user_id},
                "$inc": {"following_count": -1}
            }
        )
        return {"message": "Unfollowed", "is_following": False}
    else:
        # Follow
        users_collection.update_one(
            {"_id": target_user["_id"]},
            {
                "$addToSet": {"followers": current_user_id},
                "$inc": {"followers_count": 1}
            }
        )
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {
                "$addToSet": {"following": target_user_id},
                "$inc": {"following_count": 1}
            }
        )
        return {"message": "Followed", "is_following": True}


# ---------------------------
# UPDATE PROFILE
# ---------------------------
@router.patch("/profile")
def update_profile(profile: ProfileUpdate, current_user=Depends(get_current_user)):
    update_data = {}
    if profile.display_name is not None:
        update_data["display_name"] = profile.display_name
    if profile.bio is not None:
        update_data["bio"] = profile.bio
    if profile.avatar is not None:
        update_data["avatar"] = profile.avatar
    if profile.banner is not None:
        update_data["banner"] = profile.banner
    
    if update_data:
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated"}


# ---------------------------
# UPDATE USER SETTINGS
# ---------------------------
@router.patch("/settings")
def update_user_settings(settings: UserSettings, current_user=Depends(get_current_user)):
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"allow_mature_content": settings.allow_mature_content}}
    )
    return {"message": "Settings updated"}


# ---------------------------
# GET USER SETTINGS
# ---------------------------
@router.get("/settings/me")
def get_user_settings(current_user=Depends(get_current_user)):
    return {
        "allow_mature_content": current_user.get("allow_mature_content", False)
    }


# ---------------------------
# FOLLOW / UNFOLLOW USER
# ---------------------------
@router.post("/follow/{user_id}")
def follow_user(user_id: str, current_user=Depends(get_current_user)):
    current_user_id = str(current_user["_id"])

    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target_user = users_collection.find_one({"_id": ObjectId(user_id)})

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already following
    if current_user_id in target_user.get("followers", []):
        # Unfollow
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"followers": current_user_id}}
        )

        users_collection.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$pull": {"following": user_id}}
        )

        return {"message": "Unfollowed"}

    else:
        # Follow
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"followers": current_user_id}}
        )

        users_collection.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$push": {"following": user_id}}
        )

        return {"message": "Followed"}


# ---------------------------
# GET USER COMMENTS
# ---------------------------
@router.get("/u/{username}/comments")
def get_user_comments(username: str, sort: str = "new", current_user=Depends(get_current_user)):
    user = users_collection.find_one({"username": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = str(user["_id"])
    sort_order = [("created_at", -1)] if sort == "new" else [("likes_count", -1), ("created_at", -1)]
    
    comments = []
    for comment in comments_collection.find({"user_id": user_id}).sort(sort_order).limit(20):
        # Get post info
        post = posts_collection.find_one({"_id": ObjectId(comment["post_id"])})
        if not post:
            continue
        
        post_title = post.get("title", "Untitled Post")
        
        # Get community info if post is in a community
        community_name = None
        if post.get("community_id"):
            comm = communities_collection.find_one({"_id": ObjectId(post["community_id"])})
            if comm:
                community_name = comm["name"]
        
        comments.append({
            "comment_id": str(comment["_id"]),
            "content": comment["content"],
            "created_at": comment.get("created_at").isoformat() if comment.get("created_at") else None,
            "post_id": comment["post_id"],
            "post_title": post_title,
            "community_name": community_name,
            "comment_author_username": username
        })
    
    return {"results": comments}


# ---------------------------
# GET USER SAVED POSTS (Owner Only)
# ---------------------------
@router.get("/u/{username}/saved")
def get_user_saved_posts(username: str, current_user=Depends(get_current_user)):
    user = users_collection.find_one({"username": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only allow access to own saved posts
    if str(current_user["_id"]) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # TODO: Implement when saved posts feature is ready
    return {"results": []}


# ---------------------------
# GET USER UPVOTED POSTS (Owner Only)
# ---------------------------
@router.get("/u/{username}/upvoted")
def get_user_upvoted_posts(username: str, current_user=Depends(get_current_user)):
    user = users_collection.find_one({"username": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only allow access to own upvoted posts
    if str(current_user["_id"]) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get posts user has liked
    posts = []
    for post in posts_collection.find({"likes": str(current_user["_id"])}).sort("created_at", -1).limit(20):
        user_doc = users_collection.find_one({"_id": ObjectId(post["author_id"])})
        post_username = user_doc["username"] if user_doc else "Unknown"
        
        # Get community info if post is in a community
        community_name = None
        community_slug = None
        if post.get("community_id"):
            comm = communities_collection.find_one({"_id": ObjectId(post["community_id"])})
            if comm:
                community_name = comm["name"]
                community_slug = comm.get("slug", "")
        
        likes_list = post.get("likes", [])
        
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "content_type": post.get("content_type", "text"),
            "image_url": post.get("image_url"),
            "video_url": post.get("video_url"),
            "author_id": post["author_id"],
            "username": post_username,
            "community_name": community_name,
            "community_slug": community_slug,
            "likes_count": len(likes_list),
            "liked_by_me": True,  # Always true since these are upvoted posts
            "saved_by_me": False,
            "comments_count": post.get("comments_count", 0),
            "topic": post.get("topic", "General"),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    
    return {"results": posts}
