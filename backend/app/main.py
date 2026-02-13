from fastapi import FastAPI
from app.routes.auth import router as auth_router
from app.routes.posts import router as posts_router
from app.routes.comments import router as comments_router

app = FastAPI(title="Threadify API (Dev)")

app.include_router(posts_router)
app.include_router(auth_router)
app.include_router(comments_router)

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "Threadify backend is live"
    }
