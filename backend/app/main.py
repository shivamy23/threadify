from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect

# Import routes
from app.routes.auth import router as auth_router
from app.routes.password_auth import router as password_auth_router
from app.routes.advanced_auth import router as advanced_auth_router
from app.routes.posts import router as posts_router
from app.routes.post_interactions import router as post_interactions_router
from app.routes.comments import router as comments_router
from app.routes.collections import router as collections_router
from app.routes.admin import router as admin_router
from app.routes.users import router as users_router
from app.routes.notifications import router as notifications_router
from app.routes.communities import router as communities_router
from app.routes.search import router as search_router
from app.routes.messages import router as messages_router
from app.utils.socket_manager import manager
from app.utils.jwt import decode_access_token
from jose import ExpiredSignatureError, JWTError

app = FastAPI(title="Threadify API (Dev)")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "videos").mkdir(exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import database after app creation to handle connection errors gracefully
try:
    from app import database
    print("✅ Database module loaded successfully")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("⚠️  Server will start but database operations will fail")
    print("⚠️  Please check your MONGO_URI in .env file")

# Include routers
app.include_router(posts_router)
app.include_router(post_interactions_router)
app.include_router(auth_router)
app.include_router(password_auth_router)
app.include_router(advanced_auth_router)
app.include_router(comments_router)
app.include_router(users_router)
app.include_router(notifications_router)
app.include_router(communities_router)
app.include_router(collections_router)
app.include_router(admin_router)
app.include_router(search_router)
app.include_router(messages_router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_id = None

    try:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=1008)
            return

        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            await websocket.close(code=1008)
            return

        manager.connect(user_id, websocket)

        while True:
            await websocket.receive_text()

    except ExpiredSignatureError:
        await websocket.close(code=1008)

    except JWTError:
        await websocket.close(code=1008)

    except WebSocketDisconnect:
        pass

    finally:
        if user_id:
            manager.disconnect(user_id)

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "Threadify backend is live"
    }
