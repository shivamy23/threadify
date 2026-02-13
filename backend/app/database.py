from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
import certifi

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise Exception("MONGO_URI not found")

client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where()
)

db = client["threadify"]

users_collection = db["users"]
posts_collection = db["posts"]
comments_collection = db["comments"]
moderation_collection = db["moderation_logs"]
