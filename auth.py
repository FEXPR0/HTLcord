# auth.py
# JWT JSON Web Token

import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set in .env file")

ALGORITHM  = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 12  # Token gilt 12 Stunden

# CryptContext kümmert sich um sichere Passwort-Hashes.
# bcrypt_sha256 prevents bcrypt's 72-byte password limit by hashing the password with SHA-256 first.
pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Prüft ob ein Klartext-Passwort zum gespeicherten Hash passt.
    Gibt True zurück wenn korrekt, sonst False.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_token(username: str) -> str:
    """
    Erstellt einen JWT-Token für einen eingeloggten User.
    Der Token enthält den Username und läuft nach 24h ab.
    """
    expire = datetime.now() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    data = {"sub": username, "exp": expire}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    """
    Liest den Username aus einem JWT-Token heraus.
    Wirft eine Exception wenn der Token ungültig oder abgelaufen ist.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": True})
        username = payload.get("sub")
        if username is None:
            raise Exception("Invalid token, username not found in payload")
        return username
    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")
    except jwt.InvalidTokenError as e:
        raise Exception(f"Token verification failed: {str(e)}")
    except Exception as e:
        raise Exception(f"Token verification failed: {str(e)}")
