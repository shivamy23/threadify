from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime

from ..database import (
    posts_collection, 
    comments_collection, 
    users_collection,
    saved_posts_collection,
    communities_collection,
    collections_collection,
    collection_posts_collection
)
from ..models.comment import CommentCreate, comment_document
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/posts", tags=["Post Interactions"])

# ---------------------------
# GET SAVED POSTS
# ---------------------------
@router.get("/saved")
def get_saved_posts(current_user=Depends(get_current_user)):
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
            "author_id": post["author_id"],
            "username": username,
            "community_name": community_name,
            "community_slug": community_slug,
            "likes_count": len(likes_list),
            "liked_by_me": user_id in likes_list,
            "saved_by_me": True,  # Always true for saved posts
            "comments_count": post.get("comments_count", 0),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    
    return {"posts": posts}


@router.post("/{post_id}/save")
def toggle_save_post(post_id: str, current_user=Depends(get_current_user)):
    # Check if post exists
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    user_id = str(current_user["_id"])
    
    # Check if already saved
    existing_save = saved_posts_collection.find_one({
        "user_id": user_id,
        "post_id": post_id
    })
    
    if existing_save:
        # Unsave - remove from saved_posts and all collections
        saved_posts_collection.delete_one({"_id": existing_save["_id"]})
        
        # Remove from all user's collections
        user_collections = collections_collection.find({"user_id": user_id})
        for collection in user_collections:
            collection_posts_collection.delete_one({
                "collection_id": str(collection["_id"]),
                "post_id": post_id
            })
        
        return {"saved": False, "message": "Post unsaved"}
    else:
        # Save - add to saved_posts and default collection
        save_doc = {
            "user_id": user_id,
            "post_id": post_id,
            "created_at": datetime.now()
        }
        saved_posts_collection.insert_one(save_doc)
        
        # Ensure user has a default "Saved" collection
        default_collection = collections_collection.find_one({
            "user_id": user_id,
            "name": "Saved"
        })
        
        if not default_collection:
            from ..models.collection import collection_document
            new_collection = collection_document(user_id, "Saved")
            result = collections_collection.insert_one(new_collection)
            default_collection_id = str(result.inserted_id)
        else:
            default_collection_id = str(default_collection["_id"])
        
        # Add to default collection if not already there
        existing_in_collection = collection_posts_collection.find_one({
            "collection_id": default_collection_id,
            "post_id": post_id
        })
        
        if not existing_in_collection:
            from ..models.collection import collection_post_document
            collection_post = collection_post_document(default_collection_id, post_id)
            collection_posts_collection.insert_one(collection_post)
        
        return {"saved": True, "message": "Post saved"}

@router.post("/{post_id}/comments")
def create_comment(post_id: str, comment: CommentCreate, current_user=Depends(get_current_user)):
    # Check if post exists
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Validate content
    if not comment.content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")
    
    if len(comment.content) > 1000:
        raise HTTPException(status_code=400, detail="Comment too long")
    
    # Check parent comment if provided
    if comment.parent_id:
        parent = comments_collection.find_one({"_id": ObjectId(comment.parent_id)})
        if not parent or parent["post_id"] != post_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")
    
    # Create comment
    user_id = str(current_user["_id"])
    new_comment = comment_document(post_id, user_id, comment.content.strip(), comment.parent_id)
    result = comments_collection.insert_one(new_comment)
    
    # Update post comment count
    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"comments_count": 1}}
    )
    
    # Return comment with user info
    return {
        "id": str(result.inserted_id),
        "content": comment.content.strip(),
        "username": current_user["username"],
        "created_at": new_comment["created_at"].isoformat(),
        "likes_count": 0,
        "liked_by_me": False,
        "parent_id": comment.parent_id
    }

@router.get("/{post_id}/comments")
def get_comments(post_id: str, current_user=Depends(get_current_user)):
    # Check if post exists
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get comments
    comments = []
    current_user_id = str(current_user["_id"])
    
    for comment in comments_collection.find({"post_id": post_id}).sort("created_at", -1):
        # Get comment author
        author = users_collection.find_one({"_id": ObjectId(comment["user_id"])})
        username = author["username"] if author else "Unknown"
        
        likes_list = comment.get("likes", [])
        
        comments.append({
            "id": str(comment["_id"]),
            "content": comment["content"],
            "username": username,
            "user_id": comment["user_id"],
            "created_at": comment["created_at"].isoformat(),
            "likes_count": len(likes_list),
            "liked_by_me": current_user_id in likes_list,
            "parent_id": comment.get("parent_id")
        })
    
    return {"comments": comments}

@router.post("/comments/{comment_id}/like")
def toggle_comment_like(comment_id: str, current_user=Depends(get_current_user)):
    comment = comments_collection.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    user_id = str(current_user["_id"])
    likes = comment.get("likes", [])
    
    if user_id in likes:
        # Unlike
        comments_collection.update_one(
            {"_id": ObjectId(comment_id)},
            {
                "$pull": {"likes": user_id},
                "$inc": {"likes_count": -1}
            }
        )
        return {"liked": False, "likes_count": len(likes) - 1}
    else:
        # Like
        comments_collection.update_one(
            {"_id": ObjectId(comment_id)},
            {
                "$addToSet": {"likes": user_id},
                "$inc": {"likes_count": 1}
            }
        )
        return {"liked": True, "likes_count": len(likes) + 1}