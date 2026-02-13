from database import users_collection
from models.user import user_document
from utils.security import hash_password

plain_password = "test1234"

hashed_password = hash_password(plain_password)

user = user_document(
    email="hasheduser@example.com",
    hashed_password=hashed_password
)

result = users_collection.insert_one(user)

print("User inserted with hashed password")
print("User ID:", result.inserted_id)
