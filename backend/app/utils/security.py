import bcrypt

def hash_password(password: str) -> str:
    # Convert string to bytes
    password_bytes = password.encode("utf-8")

    # Generate salt and hash
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())

    # Store as string
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except ValueError:
        return False
