from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from ..models.post import PostUpdate
from ..database import posts_collection
from ..models.post import PostCreate, post_document
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/")
def create_post(
    post: PostCreate,
    current_user=Depends(get_current_user)
):
    new_post = post_document(
        title=post.title,
        content=post.content,
        user_id=str(current_user["_id"])
    )

    result = posts_collection.insert_one(new_post)

    return {
        "message": "Post created successfully",
        "post_id": str(result.inserted_id)
    }


@router.get("/")
def get_all_posts(
    page: int = 1,
    limit: int = 5,
    current_user=Depends(get_current_user)
):
    skip = (page - 1) * limit

    posts = []

    query = {}

    # If not admin → hide flagged posts
    if current_user["role"] != "admin":
        query["flagged"] = False

    for post in posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "author_id": post["author_id"],
            "flagged": post.get("flagged", False)
        })

    return {
        "page": page,
        "limit": limit,
        "results": posts
    }


@router.get("/me")
def get_my_posts(current_user=Depends(get_current_user)):
    posts = []

    for post in posts_collection.find({"author_id": str(current_user["_id"])}):
        posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "author_id": post["author_id"]
        })

    return posts


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
        # If not admin, must be author
        if post["author_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not allowed to update this post")

    update_data = {}

    if post_update.title is not None:
        update_data["title"] = post_update.title

    if post_update.content is not None:
        update_data["content"] = post_update.content

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": update_data}
    )

    return {"message": "Post updated successfully"}
