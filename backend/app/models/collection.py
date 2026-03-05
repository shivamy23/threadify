from datetime import datetime


def collection_document(user_id: str, name: str):
    return {
        "user_id": user_id,
        "name": name,
        "created_at": datetime.now()
    }


def collection_post_document(collection_id: str, post_id: str):
    return {
        "collection_id": collection_id,
        "post_id": post_id,
        "added_at": datetime.now()
    }