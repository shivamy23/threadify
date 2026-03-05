from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
import certifi
import ssl

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise Exception("MONGO_URI not found in .env file")

try:
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=False,
        serverSelectionTimeoutMS=5000,
        retryWrites=True,
        w='majority'
    )
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connected successfully")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    raise

db = client["threadify"]

users_collection = db["users"]
posts_collection = db["posts"]
comments_collection = db["comments"]
moderation_collection = db["moderation_logs"]
notifications_collection = db["notifications"]
communities_collection = db["communities"]
otp_collection = db["otp"]
refresh_tokens_collection = db["refresh_tokens"]
password_reset_tokens_collection = db["password_reset_tokens"]
password_reset_collection = db["password_reset"]
saved_posts_collection = db["saved_posts"]
collections_collection = db["collections"]
collection_posts_collection = db["collection_posts"]
messages_collection = db["messages"]
conversations_collection = db["conversations"]

# Create unique indexes
try:
    users_collection.create_index("email", unique=True)
    users_collection.create_index("username", unique=True)
    users_collection.create_index("risk_score")
    users_collection.create_index([("username", "text"), ("bio", "text")])
    password_reset_collection.create_index("user_id")
    password_reset_collection.create_index("expires_at", expireAfterSeconds=0)
    posts_collection.create_index("author_id")
    posts_collection.create_index([("created_at", -1)])
    posts_collection.create_index("topic")
    posts_collection.create_index("safety_score")
    posts_collection.create_index("flagged")
    posts_collection.create_index([("title", "text"), ("content", "text")])
    communities_collection.create_index([("name", "text"), ("description", "text")])
    conversations_collection.create_index("participants")
    messages_collection.create_index("conversation_id")
    messages_collection.create_index([("created_at", 1)])
    print("✅ Database indexes created")
except Exception as e:
    print(f"⚠️ Index creation: {e}")
