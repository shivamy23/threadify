from pymongo import MongoClient
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
db = client[os.getenv("DATABASE_NAME", "threadify")]

def setup_indexes():
    """Create unique indexes for usernames and community names"""
    
    # Users collection - unique username and email indexes
    try:
        db.users.create_index("username", unique=True)
        print("Created unique index on users.username")
    except Exception as e:
        print(f"Username index: {e}")
    
    try:
        db.users.create_index("email", unique=True)
        print("Created unique index on users.email")
    except Exception as e:
        print(f"Email index: {e}")
    
    # Communities collection - unique name and slug indexes
    try:
        db.communities.create_index("name", unique=True)
        print("Created unique index on communities.name")
    except Exception as e:
        print(f"Community name index: {e}")
    
    try:
        db.communities.create_index("slug", unique=True)
        print("Created unique index on communities.slug")
    except Exception as e:
        print(f"Community slug index: {e}")
    
    # OTP collection - TTL index for auto-expiration
    try:
        db.otp.create_index("expires_at", expireAfterSeconds=0)
        print("Created TTL index on otp.expires_at")
    except Exception as e:
        print(f"OTP TTL index: {e}")
    
    try:
        db.otp.create_index("email")
        print("Created index on otp.email")
    except Exception as e:
        print(f"OTP email index: {e}")
    
    # Comments collection indexes
    try:
        db.comments.create_index("post_id")
        print("Created index on comments.post_id")
    except Exception as e:
        print(f"Comments post_id index: {e}")
    
    try:
        db.comments.create_index("user_id")
        print("Created index on comments.user_id")
    except Exception as e:
        print(f"Comments user_id index: {e}")
    
    # Saved posts collection indexes
    try:
        db.saved_posts.create_index([("user_id", 1), ("post_id", 1)], unique=True)
        print("Created unique compound index on saved_posts.user_id + post_id")
    except Exception as e:
        print(f"Saved posts compound index: {e}")

def remove_karma_field():
    """Remove karma field from existing users and update password field"""
    try:
        # Remove karma field
        result = db.users.update_many({}, {"$unset": {"karma": ""}})
        print(f"Removed karma field from {result.modified_count} users")
        
        # Rename password field to password_hash if it exists
        users_with_password = db.users.find({"password": {"$exists": True}})
        count = 0
        for user in users_with_password:
            db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$rename": {"password": "password_hash"},
                    "$set": {"updated_at": datetime.now()}
                }
            )
            count += 1
        print(f"Updated password field for {count} users")
        
    except Exception as e:
        print(f"Remove karma/update password: {e}")

if __name__ == "__main__":
    print("Setting up database indexes and cleanup...")
    setup_indexes()
    remove_karma_field()
    print("Database setup complete!")