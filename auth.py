# auth.py
# Alles rund um Passwörter und JWT-Tokens.
#
# JWT = JSON Web Token
# Ein Token ist eine kurze verschlüsselte Zeichenkette die beweist,
# dass man eingeloggt ist - ohne jedes Mal das Passwort zu prüfen.
# Aufbau: header.payload.signature (Base64 kodiert)

from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "htlcord-geheimschluessel"  # TODO: in Produktion sicher ersetzen!
ALGORITHM  = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24  # Token gilt 24 Stunden

# CryptContext kümmert sich um bcrypt-Hashing
pwd_context = CryptContext(schemes=["bcrypt"])


def hash_password(plain_password: str) -> str:
    """
    Passwort hashen - aus "hallo123" wird ein sicherer Hash.
    Der Hash kann nicht rückgängig gemacht werden.
    """
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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise Exception("Invalid token, username not found in payload")
        return username
    except:
        raise Exception("Token verification failed")
