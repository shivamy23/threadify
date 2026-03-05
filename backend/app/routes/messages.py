from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime

from ..database import users_collection, messages_collection, conversations_collection
from ..utils.dependencies import get_current_user
from ..models.message import message_document, conversation_document
from ..utils.jwt import decode_access_token
from ..utils.socket_manager import manager

router = APIRouter(prefix="/messages", tags=["Messages"])

class StartChatRequest(BaseModel):
    username: str

class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str

# ---------------------------
# START CONVERSATION
# ---------------------------
@router.post("/start")
def start_conversation(request: StartChatRequest, current_user=Depends(get_current_user)):
    # Find target user
    target_user = users_collection.find_one({"username": request.username})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_user_id = str(current_user["_id"])
    target_user_id = str(target_user["_id"])
    
    # Prevent self-chat
    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")
    
    # Check if conversation exists
    participants = sorted([current_user_id, target_user_id])
    existing_conv = conversations_collection.find_one({"participants": participants})
    
    if existing_conv:
        return {
            "conversation_id": str(existing_conv["_id"]),
            "username": request.username,
            "user_id": target_user_id
        }
    
    # Create new conversation
    new_conv = conversation_document(participants)
    result = conversations_collection.insert_one(new_conv)
    
    return {
        "conversation_id": str(result.inserted_id),
        "username": request.username,
        "user_id": target_user_id
    }

# ---------------------------
# GET CONVERSATIONS
# ---------------------------
@router.get("/conversations")
def get_conversations(current_user=Depends(get_current_user)):
    current_user_id = str(current_user["_id"])
    
    conversations = []
    for conv in conversations_collection.find(
        {"participants": current_user_id}
    ).sort("updated_at", -1):
        
        # Get other participant
        other_user_id = [p for p in conv["participants"] if p != current_user_id][0]
        other_user = users_collection.find_one({"_id": ObjectId(other_user_id)})
        
        if not other_user:
            continue
        
        # Get unread count
        unread_count = messages_collection.count_documents({
            "conversation_id": str(conv["_id"]),
            "receiver_id": current_user_id,
            "read": False
        })
        
        conversations.append({
            "id": str(conv["_id"]),
            "username": other_user["username"],
            "user_id": other_user_id,
            "last_message": conv.get("last_message", ""),
            "updated_at": conv["updated_at"].isoformat(),
            "unread_count": unread_count
        })
    
    return {"conversations": conversations}

# ---------------------------
# GET MESSAGES
# ---------------------------
@router.get("/{conversation_id}")
def get_messages(conversation_id: str, current_user=Depends(get_current_user)):
    # Verify conversation exists and user is participant
    conv = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    current_user_id = str(current_user["_id"])
    if current_user_id not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mark messages as read
    messages_collection.update_many(
        {
            "conversation_id": conversation_id,
            "receiver_id": current_user_id,
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    # Get messages
    messages = []
    for msg in messages_collection.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1):
        
        sender = users_collection.find_one({"_id": ObjectId(msg["sender_id"])})
        
        messages.append({
            "id": str(msg["_id"]),
            "content": msg["content"],
            "sender_id": msg["sender_id"],
            "sender_username": sender["username"] if sender else "Unknown",
            "created_at": msg["created_at"].isoformat(),
            "read": msg["read"]
        })
    
    return {"messages": messages}

# ---------------------------
# SEND MESSAGE (REST)
# ---------------------------
@router.post("/send")
async def send_message(request: SendMessageRequest, current_user=Depends(get_current_user)):
    # Verify conversation
    conv = conversations_collection.find_one({"_id": ObjectId(request.conversation_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    current_user_id = str(current_user["_id"])
    if current_user_id not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get receiver
    receiver_id = [p for p in conv["participants"] if p != current_user_id][0]
    
    # Create message
    new_message = message_document(
        request.conversation_id,
        current_user_id,
        receiver_id,
        request.content
    )
    result = messages_collection.insert_one(new_message)
    
    # Update conversation
    conversations_collection.update_one(
        {"_id": ObjectId(request.conversation_id)},
        {
            "$set": {
                "last_message": request.content[:50],
                "updated_at": datetime.now()
            }
        }
    )
    
    # Send via WebSocket
    message_data = {
        "type": "message",
        "id": str(result.inserted_id),
        "conversation_id": request.conversation_id,
        "content": request.content,
        "sender_id": current_user_id,
        "sender_username": current_user["username"],
        "created_at": new_message["created_at"].isoformat()
    }
    
    await manager.send_message(receiver_id, message_data)
    
    return message_data

# ---------------------------
# WEBSOCKET ENDPOINT
# ---------------------------
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            await websocket.close(code=1008)
            return
        
        await manager.connect(user_id, websocket)
        
        while True:
            data = await websocket.receive_json()
            
            # Handle incoming message
            if data.get("type") == "message":
                conversation_id = data.get("conversation_id")
                content = data.get("content")
                
                # Verify conversation
                conv = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
                if not conv or user_id not in conv["participants"]:
                    continue
                
                # Get receiver
                receiver_id = [p for p in conv["participants"] if p != user_id][0]
                
                # Save message
                new_message = message_document(conversation_id, user_id, receiver_id, content)
                result = messages_collection.insert_one(new_message)
                
                # Update conversation
                conversations_collection.update_one(
                    {"_id": ObjectId(conversation_id)},
                    {
                        "$set": {
                            "last_message": content[:50],
                            "updated_at": datetime.now()
                        }
                    }
                )
                
                # Get sender info
                sender = users_collection.find_one({"_id": ObjectId(user_id)})
                
                # Broadcast to receiver
                message_data = {
                    "type": "message",
                    "id": str(result.inserted_id),
                    "conversation_id": conversation_id,
                    "content": content,
                    "sender_id": user_id,
                    "sender_username": sender["username"] if sender else "Unknown",
                    "created_at": new_message["created_at"].isoformat()
                }
                
                await manager.send_message(receiver_id, message_data)
                await manager.send_message(user_id, message_data)
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user_id)
