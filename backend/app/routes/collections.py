from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel
from typing import List

from ..database import (
    collections_collection,
    collection_posts_collection,
    posts_collection,
    users_collection,
    communities_collection
)
from ..models.collection import collection_document, collection_post_document
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/collections", tags=["Collections"])

class CollectionCreate(BaseModel):
    name: str

class CollectionUpdate(BaseModel):
    name: str

class AddPostToCollection(BaseModel):
    post_id: str

@router.post("")
def create_collection(collection: CollectionCreate, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Validate name
    if not collection.name.strip():
        raise HTTPException(status_code=400, detail="Collection name cannot be empty")
    
    if len(collection.name.strip()) > 50:
        raise HTTPException(status_code=400, detail="Collection name too long")
    
    # Check if collection already exists for this user
    existing = collections_collection.find_one({
        "user_id": user_id,
        "name": collection.name.strip()
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this name already exists")
    
    # Create collection
    new_collection = collection_document(user_id, collection.name.strip())
    result = collections_collection.insert_one(new_collection)
    
    return {
        "id": str(result.inserted_id),
        "name": collection.name.strip(),
        "created_at": new_collection["created_at"].isoformat(),
        "posts_count": 0
    }

@router.get("")
def get_collections(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    collections = []
    for collection in collections_collection.find({"user_id": user_id}).sort("created_at", 1):
        # Count posts in collection
        posts_count = collection_posts_collection.count_documents({
            "collection_id": str(collection["_id"])
        })
        
        collections.append({
            "id": str(collection["_id"]),
            "name": collection["name"],
            "created_at": collection["created_at"].isoformat(),
            "posts_count": posts_count
        })
    
    return {"collections": collections}

@router.post("/{collection_id}/posts")
def add_post_to_collection(collection_id: str, data: AddPostToCollection, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if collection exists and belongs to user
    collection = collections_collection.find_one({
        "_id": ObjectId(collection_id),
        "user_id": user_id
    })
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Check if post exists
    post = posts_collection.find_one({"_id": ObjectId(data.post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if post already in collection
    existing = collection_posts_collection.find_one({
        "collection_id": collection_id,
        "post_id": data.post_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Post already in collection")
    
    # Add post to collection
    collection_post = collection_post_document(collection_id, data.post_id)
    collection_posts_collection.insert_one(collection_post)
    
    return {"message": "Post added to collection"}

@router.delete("/{collection_id}/posts/{post_id}")
def remove_post_from_collection(collection_id: str, post_id: str, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if collection exists and belongs to user
    collection = collections_collection.find_one({
        "_id": ObjectId(collection_id),
        "user_id": user_id
    })
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Remove post from collection
    result = collection_posts_collection.delete_one({
        "collection_id": collection_id,
        "post_id": post_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found in collection")
    
    return {"message": "Post removed from collection"}

@router.put("/{collection_id}")
def update_collection(collection_id: str, data: CollectionUpdate, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Validate name
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Collection name cannot be empty")
    
    if len(data.name.strip()) < 3 or len(data.name.strip()) > 50:
        raise HTTPException(status_code=400, detail="Collection name must be 3-50 characters")
    
    # Check if collection exists and belongs to user
    collection = collections_collection.find_one({
        "_id": ObjectId(collection_id),
        "user_id": user_id
    })
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Don't allow renaming default "Saved" collection
    if collection["name"] == "Saved":
        raise HTTPException(status_code=400, detail="Cannot rename default Saved collection")
    
    # Check if new name already exists for this user
    existing = collections_collection.find_one({
        "user_id": user_id,
        "name": data.name.strip(),
        "_id": {"$ne": ObjectId(collection_id)}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this name already exists")
    
    # Update collection
    collections_collection.update_one(
        {"_id": ObjectId(collection_id)},
        {"$set": {"name": data.name.strip()}}
    )
    
    return {
        "id": collection_id,
        "name": data.name.strip(),
        "message": "Collection renamed"
    }

@router.delete("/{collection_id}")
def delete_collection(collection_id: str, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if collection exists and belongs to user
    collection = collections_collection.find_one({
        "_id": ObjectId(collection_id),
        "user_id": user_id
    })
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Don't allow deleting default "Saved" collection
    if collection["name"] == "Saved":
        raise HTTPException(status_code=400, detail="Cannot delete default Saved collection")
    
    # Delete all posts from collection
    collection_posts_collection.delete_many({"collection_id": collection_id})
    
    # Delete collection
    collections_collection.delete_one({"_id": ObjectId(collection_id)})
    
    return {"message": "Collection deleted"}

@router.get("/{collection_id}/posts")
def get_collection_posts(collection_id: str, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if collection exists and belongs to user
    collection = collections_collection.find_one({
        "_id": ObjectId(collection_id),
        "user_id": user_id
    })
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Get posts in collection
    collection_posts = list(collection_posts_collection.find({
        "collection_id": collection_id
    }).sort("added_at", -1))
    
    if not collection_posts:
        return {"posts": []}
    
    # Get post details
    post_ids = [ObjectId(cp["post_id"]) for cp in collection_posts]
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
            "saved_by_me": True,
            "comments_count": post.get("comments_count", 0),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    
    return {"posts": posts}