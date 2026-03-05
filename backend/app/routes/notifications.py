from fastapi import APIRouter, Depends
from bson import ObjectId
from ..database import notifications_collection, users_collection
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
def get_notifications(current_user=Depends(get_current_user)):
    notifications = []

    for notif in notifications_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1):

        source_user = users_collection.find_one(
            {"_id": ObjectId(notif["source_user_id"])}
        )

        notifications.append({
            "id": str(notif["_id"]),
            "type": notif["type"],
            "source_username": source_user["username"] if source_user else "Unknown",
            "post_id": notif.get("post_id"),
            "read": notif["read"]
        })

    return notifications


@router.put("/read/{notification_id}")
def mark_read(notification_id: str, current_user=Depends(get_current_user)):
    notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}
