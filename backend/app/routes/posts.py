from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from ..database import posts_collection
from ..models.post import PostCreate, PostUpdate, post_document
from ..utils.dependencies import get_current_user
from ..ai.moderation_agent import moderate_content


router = APIRouter(prefix="/posts", tags=["Posts"])


# ---------------------------
# CREATE POST (WITH AI MODERATION)
# ---------------------------
@router.post("/")
def create_post(
    post: PostCreate,
    current_user=Depends(get_current_user)
):
    # Run AI moderation
    moderation_result = moderate_content(post.content)

    new_post = post_document(
        title=post.title,
        content=moderation_result["content"],  # redacted content
        user_id=str(current_user["_id"])
    )

    # Store moderation metadata
    new_post["flagged"] = moderation_result["flagged"]
    new_post["moderation_score"] = moderation_result["analysis"]["score"]

    result = posts_collection.insert_one(new_post)

    return {
        "message": "Post created successfully",
        "post_id": str(result.inserted_id),
        "flagged": new_post["flagged"]
    }


# ---------------------------
# GET ALL POSTS (PAGINATED + ROLE FILTERED)
# ---------------------------
@router.get("/")
def get_all_posts(
    page: int = 1,
    limit: int = 5,
    current_user=Depends(get_current_user)
):
    skip = (page - 1) * limit
    posts = []
    query = {}

    # Normal users cannot see flagged posts
    if current_user["role"] != "admin":
        query["flagged"] = False

    for post in posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "author_id": post["author_id"],
            "flagged": post.get("flagged", False),
            "moderation_score": post.get("moderation_score", 0)
        })

    return {
        "page": page,
        "limit": limit,
        "results": posts
    }


# ---------------------------
# GET MY POSTS
# ---------------------------
@router.get("/me")
def get_my_posts(current_user=Depends(get_current_user)):
    posts = []

    for post in posts_collection.find({"author_id": str(current_user["_id"])}):
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "flagged": post.get("flagged", False)
        })

    return posts


# ---------------------------
# GET FLAGGED POSTS (ADMIN ONLY)
# ---------------------------
# ---------------------------
# ADMIN: REVIEW FLAGGED POSTS
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
def delete_post(
    post_id: str,
    current_user=Depends(get_current_user)
):
    post = posts_collection.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Admin can delete any post
    if current_user["role"] == "admin":
        posts_collection.delete_one({"_id": ObjectId(post_id)})
        return {"message": "Post deleted by admin"}

    # Normal user → only own post
    if post["author_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not allowed to delete this post")

    posts_collection.delete_one({"_id": ObjectId(post_id)})

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

    # Admin can update any post
    if current_user["role"] != "admin":
        if post["author_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not allowed to update this post")

    update_data = {}

    if post_update.title is not None:
        update_data["title"] = post_update.title

    if post_update.content is not None:
        # Re-run moderation on updated content
        moderation_result = moderate_content(post_update.content)
        update_data["content"] = moderation_result["content"]
        update_data["flagged"] = moderation_result["flagged"]
        update_data["moderation_score"] = moderation_result["analysis"]["score"]

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": update_data}
    )

    return {"message": "Post updated successfully"}
