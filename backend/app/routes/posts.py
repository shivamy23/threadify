from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import Optional
from bson import ObjectId
import os
import uuid
import shutil
from pathlib import Path
from ..database import posts_collection, users_collection, saved_posts_collection, comments_collection
from ..models.post import PostCreate, PostUpdate, post_document
from ..utils.dependencies import get_current_user
from ..ai.multi_agent import multi_agent_moderate, get_flag_explanation
from ..ai.redactor import redact_sensitive_content
from ..ai.topic_classifier import classify_topic
from ..ai.summarizer import summarize_discussion
from ..models.notification import notification_document
from ..database import notifications_collection



router = APIRouter(prefix="/posts", tags=["Posts"])

# File upload configuration
UPLOAD_DIR = Path("uploads")
IMAGE_DIR = UPLOAD_DIR / "images"
VIDEO_DIR = UPLOAD_DIR / "videos"

# Create directories if they don't exist
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_VIDEO_SIZE = 20 * 1024 * 1024  # 20MB


# ---------------------------
# CREATE POST (with media support)
# ---------------------------
@router.post("/")
async def create_post(
    title: str = Form(...),
    content: Optional[str] = Form(None),
    community_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user)
):
    # Determine content type
    content_type = "text"
    image_url = None
    video_url = None
    
    # Validate only one content type
    media_count = sum([bool(content), bool(image), bool(video)])
    if media_count == 0:
        raise HTTPException(status_code=400, detail="Post must have text, image, or video content")
    if media_count > 1:
        raise HTTPException(status_code=400, detail="Post can only have one type of content")
    
    # Handle image upload
    if image:
        # Validate file type
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPG, JPEG, PNG, WEBP, GIF")
        
        # Read file to check size
        file_content = await image.read()
        if len(file_content) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Image size exceeds 5MB limit")
        
        # Generate unique filename
        file_ext = image.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = IMAGE_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        content_type = "image"
        image_url = f"/uploads/images/{unique_filename}"
        content = ""  # No text content for image posts
    
    # Handle video upload
    elif video:
        # Validate file type
        if video.content_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(status_code=400, detail="Invalid video type. Only MP4 allowed")
        
        # Read file to check size
        file_content = await video.read()
        if len(file_content) > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail="Video size exceeds 20MB limit")
        
        # Generate unique filename
        file_ext = video.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = VIDEO_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        content_type = "video"
        video_url = f"/uploads/videos/{unique_filename}"
        content = ""  # No text content for video posts
    
    # Run AI moderation on text content
    combined_text = f"{title} {content if content else ''}"
    moderation_result = multi_agent_moderate(combined_text)
    
    # Redact sensitive information from text
    if content:
        redaction_result = redact_sensitive_content(content)
        content = redaction_result["text"]
        redacted = redaction_result["redacted"]
    else:
        redacted = False
    
    # Classify topic
    topic = classify_topic(combined_text)
    
    # Create post document
    new_post = post_document(
        title=title,
        content=content or "",
        user_id=str(current_user["_id"]),
        community_id=community_id,
        content_type=content_type,
        image_url=image_url,
        video_url=video_url
    )
    
    # Add AI moderation data
    new_post["moderation_result"] = moderation_result
    new_post["safety_score"] = moderation_result["overall_safety_score"]
    new_post["risk_level"] = moderation_result["risk_level"]
    new_post["flagged"] = moderation_result["risk_level"] == "HIGH"
    new_post["redacted"] = redacted
    new_post["topic"] = topic
    
    # Insert post
    result = posts_collection.insert_one(new_post)
    
    # Update user risk profile
    user_update = {"$inc": {"posts_count": 1}}
    if new_post["flagged"]:
        user_update["$inc"]["flagged_posts_count"] = 1
    if new_post["redacted"]:
        user_update["$inc"]["redacted_posts_count"] = 1
    
    users_collection.update_one(
        {"_id": current_user["_id"]},
        user_update
    )
    
    # Calculate user risk score
    user = users_collection.find_one({"_id": current_user["_id"]})
    total_posts = user.get("posts_count", 1)
    flagged_posts = user.get("flagged_posts_count", 0)
    risk_score = int((flagged_posts / total_posts) * 100) if total_posts > 0 else 0
    
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"risk_score": risk_score}}
    )
    
    return {
        "message": "Post created successfully",
        "post_id": str(result.inserted_id),
        "content_type": content_type,
        "image_url": image_url,
        "video_url": video_url,
        "flagged": new_post["flagged"],
        "safety_score": new_post["safety_score"],
        "risk_level": new_post["risk_level"],
        "redacted": new_post["redacted"],
        "topic": topic
    }


# ---------------------------
# GET ALL POSTS (Pagination + Likes + Username)
# ---------------------------
@router.get("/")
def get_all_posts(
    page: int = 1,
    limit: int = 5,
    search: str = None,
    sort: str = "new",
    topic: str = None,
    current_user=Depends(get_current_user)
):
    skip = (page - 1) * limit
    posts = []
    query = {}

    if current_user["role"] != "admin":
        query["flagged"] = False

    # Topic filter
    if topic:
        query["topic"] = topic

    # Search functionality
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]

    # Sorting
    sort_order = [("created_at", -1)]  # default: new
    if sort == "top":
        sort_order = [("likes", -1), ("created_at", -1)]

    for post in posts_collection.find(query).sort(sort_order).skip(skip).limit(limit):

        user = users_collection.find_one({"_id": ObjectId(post["author_id"])})
        username = user["username"] if user else "Unknown"

        current_user_id = str(current_user["_id"])
        likes_list = post.get("likes", [])
        
        # Check if post is saved by current user
        is_saved = saved_posts_collection.find_one({
            "user_id": current_user_id,
            "post_id": str(post["_id"])
        }) is not None

        # Match username in search
        if search and username.lower().find(search.lower()) == -1 and \
           post["title"].lower().find(search.lower()) == -1 and \
           post["content"].lower().find(search.lower()) == -1:
            continue

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
            "liked_by_me": current_user_id in likes_list,
            "saved_by_me": is_saved,
            "comments_count": post.get("comments_count", 0),
            "flagged": post.get("flagged", False),
            "safety_score": post.get("safety_score", 100),
            "risk_level": post.get("risk_level", "LOW"),
            "redacted": post.get("redacted", False),
            "topic": post.get("topic", "General"),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })

    return {
        "page": page,
        "limit": limit,
        "results": posts
    }

# ---------------------------
# GET FEED (Posts from Following Users)
# ---------------------------
@router.get("/feed")
def get_feed(
    page: int = 1,
    limit: int = 5,
    current_user=Depends(get_current_user)
):
    skip = (page - 1) * limit

    user = users_collection.find_one({"_id": current_user["_id"]})
    following = user.get("following", [])

    posts = []

    for post in posts_collection.find(
        {"author_id": {"$in": following}}
    ).sort("created_at", -1).skip(skip).limit(limit):

        user = users_collection.find_one({"_id": ObjectId(post["author_id"])})
        username = user["username"] if user else "Unknown"
        
        current_user_id = str(current_user["_id"])
        likes_list = post.get("likes", [])
        
        is_saved = saved_posts_collection.find_one({
            "user_id": current_user_id,
            "post_id": str(post["_id"])
        }) is not None

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
            "liked_by_me": current_user_id in likes_list,
            "saved_by_me": is_saved,
            "comments_count": post.get("comments_count", 0),
            "topic": post.get("topic", "General"),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })

    return {
        "page": page,
        "limit": limit,
        "results": posts
    }


# ---------------------------
# LIKE / UNLIKE POST
# ---------------------------
@router.post("/like/{post_id}")
def like_post(post_id: str, current_user=Depends(get_current_user)):
    post = posts_collection.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user_id = str(current_user["_id"])
    likes = post.get("likes", [])

    # UNLIKE
    if user_id in likes:
        posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"likes": user_id}}
        )
        return {"message": "Unliked"}

    # LIKE
    else:
        posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"likes": user_id}}
        )

        # 🔔 CREATE NOTIFICATION (if not liking own post)
        if post["author_id"] != user_id:
            notif = notification_document(
                user_id=post["author_id"],       # receiver
                type="like",
                source_user_id=user_id,          # who liked
                post_id=post_id
            )

            notifications_collection.insert_one(notif)

        return {"message": "Liked"}
 


# ---------------------------
# GET POSTS BY USER (Profile Page)
# ---------------------------
@router.get("/user/{user_id}")
def get_user_posts(user_id: str, current_user=Depends(get_current_user)):
    posts = []

    for post in posts_collection.find({"author_id": user_id}).sort("created_at", -1):
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        username = user["username"] if user else "Unknown"
        
        current_user_id = str(current_user["_id"])
        likes_list = post.get("likes", [])
        
        is_saved = saved_posts_collection.find_one({
            "user_id": current_user_id,
            "post_id": str(post["_id"])
        }) is not None
        
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
            "liked_by_me": current_user_id in likes_list,
            "saved_by_me": is_saved,
            "comments_count": post.get("comments_count", 0),
            "topic": post.get("topic", "General"),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })

    return posts


# ---------------------------
# ADMIN: GET FLAGGED POSTS
# ---------------------------
@router.get("/flagged")
def get_flagged_posts(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    posts = []

    for post in posts_collection.find({"flagged": True}).sort("created_at", -1):
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "author_id": post["author_id"],
            "moderation_score": post.get("moderation_score", 0),
            "created_at": post.get("created_at")
        })

    return posts


# ---------------------------
# ADMIN: APPROVE FLAGGED POST
# ---------------------------
@router.put("/approve/{post_id}")
def approve_post(post_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {"flagged": False}}
    )

    return {"message": "Post approved and unflagged"}


# ---------------------------
# DELETE POST
# ---------------------------
@router.delete("/{post_id}")
def delete_post(post_id: str, current_user=Depends(get_current_user)):
    try:
        post_obj_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    post = posts_collection.find_one({"_id": post_obj_id})

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only author or admin can delete
    if post["author_id"] != str(current_user["_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own posts")

    # Delete post
    posts_collection.delete_one({"_id": post_obj_id})
    
    # Delete associated comments
    from ..database import comments_collection
    comments_collection.delete_many({"post_id": post_id})
    
    # Remove from saved collections
    saved_posts_collection.delete_many({"post_id": post_id})
    
    from ..database import collection_posts_collection
    collection_posts_collection.delete_many({"post_id": post_id})

    return {"message": "Post deleted successfully"}


# ---------------------------
# UPDATE POST
# ---------------------------
@router.put("/{post_id}")
def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user=Depends(get_current_user)
):
    post = posts_collection.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if current_user["role"] != "admin":
        if post["author_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not allowed")

    update_data = {}

    if post_update.title is not None:
        update_data["title"] = post_update.title

    if post_update.content is not None:
        # Re-run AI moderation
        combined_text = f"{post_update.title or post['title']} {post_update.content}"
        moderation_result = multi_agent_moderate(combined_text)
        redaction_result = redact_sensitive_content(post_update.content)
        topic = classify_topic(combined_text)
        
        update_data["content"] = redaction_result["text"]
        update_data["moderation_result"] = moderation_result
        update_data["safety_score"] = moderation_result["overall_safety_score"]
        update_data["risk_level"] = moderation_result["risk_level"]
        update_data["flagged"] = moderation_result["risk_level"] == "HIGH"
        update_data["redacted"] = redaction_result["redacted"]
        update_data["topic"] = topic

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided")

    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": update_data}
    )

    return {"message": "Post updated successfully"}


# ---------------------------
# REAL-TIME MODERATION CHECK (Soft Warning)
# ---------------------------
@router.post("/moderate-check/")
def moderate_check(
    content: dict,
    current_user=Depends(get_current_user)
):
    """Real-time soft warning for content being typed"""
    text = content.get("text", "")
    
    if not text:
        return {"warning": False}
    
    moderation_result = multi_agent_moderate(text)
    
    warning = False
    warning_message = ""
    
    if moderation_result["risk_level"] in ["MEDIUM", "HIGH"]:
        warning = True
        warning_message = "Your message may contain sensitive language. Review before posting."
    
    return {
        "warning": warning,
        "message": warning_message,
        "safety_score": moderation_result["overall_safety_score"],
        "risk_level": moderation_result["risk_level"]
    }


# ---------------------------
# GET FLAG EXPLANATION
# ---------------------------
@router.get("/{post_id}/flag-explanation/")
def get_flag_explanation(
    post_id: str,
    current_user=Depends(get_current_user)
):
    """Get explanation for why content was flagged"""
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    moderation_result = post.get("moderation_result", {})
    
    if not moderation_result:
        return {"explanation": "No moderation data available"}
    
    explanation = get_flag_explanation(moderation_result)
    
    return {
        "explanation": explanation,
        "moderation_result": moderation_result
    }


# ---------------------------
# SUMMARIZE DISCUSSION
# ---------------------------
@router.get("/{post_id}/summarize/")
def summarize_post_discussion(
    post_id: str,
    current_user=Depends(get_current_user)
):
    """Generate AI summary of post discussion"""
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comments_count = post.get("comments_count", 0)
    
    if comments_count < 20:
        return {
            "summary": f"Discussion has only {comments_count} comments. Summary available after 20+ comments."
        }
    
    # Get comments
    comments = list(comments_collection.find({"post_id": post_id}).limit(100))
    
    summary = summarize_discussion(comments)
    
    return {
        "summary": summary,
        "comments_count": comments_count
    }


# ---------------------------
# GET TOPICS LIST
# ---------------------------
@router.get("/topics/list/")
def get_topics_list(current_user=Depends(get_current_user)):
    """Get list of all available topics"""
    topics = posts_collection.distinct("topic")
    return {"topics": sorted(topics)}
