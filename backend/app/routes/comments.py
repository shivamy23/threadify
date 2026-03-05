from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from ..utils.dependencies import get_current_user
from ..database import comments_collection, posts_collection
from ..models.comment import CommentCreate, comment_document
from ..ai.moderation_agent import moderate_content


router = APIRouter(prefix="/comments", tags=["Comments"])


# ---------------------------------
# CREATE COMMENT (WITH AI MODERATION)
# ---------------------------------
@router.post("/{post_id}")
def create_comment(
    post_id: str,
    comment: CommentCreate,
    current_user=Depends(get_current_user)
):
    post = posts_collection.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Run AI moderation
    moderation_result = moderate_content(comment.content)

    new_comment = comment_document(
        content=moderation_result["content"],  # redacted content
        post_id=post_id,
        user_id=str(current_user["_id"])
    )

    # Store moderation metadata
    new_comment["flagged"] = moderation_result["flagged"]
    new_comment["moderation_score"] = moderation_result["analysis"]["score"]

    result = comments_collection.insert_one(new_comment)

    return {
        "message": "Comment created successfully",
        "comment_id": str(result.inserted_id),
        "flagged": new_comment["flagged"]
    }


# ---------------------------------
# GET COMMENTS FOR A POST
# ---------------------------------
@router.get("/{post_id}")
def get_comments(post_id: str):
    comments = []

    for comment in comments_collection.find({"post_id": post_id}):
        comments.append({
            "id": str(comment["_id"]),
            "content": comment["content"],
            "author_id": comment.get("user_id", comment.get("author_id")),
            "flagged": comment.get("flagged", False)
        })

    return comments


# ---------------------------------
# DELETE COMMENT
# ---------------------------------
@router.delete("/{comment_id}")
def delete_comment(
    comment_id: str,
    current_user=Depends(get_current_user)
):
    comment = comments_collection.find_one({"_id": ObjectId(comment_id)})

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Admin can delete any comment
    if current_user.get("role") != "admin":
        comment_user_id = comment.get("user_id", comment.get("author_id"))
        if comment_user_id != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not allowed to delete this comment")

    comments_collection.delete_one({"_id": ObjectId(comment_id)})

    return {"message": "Comment deleted successfully"}
