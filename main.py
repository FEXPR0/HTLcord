# main.py
# Einstiegspunkt der Anwendung.
# Hier werden alle FastAPI-Routen (Endpunkte) definiert.
#
# Starten mit:  uvicorn main:app --reload
# API-Docs:     http://localhost:8000/docs

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import json

from database import engine, get_db, Base
from models import User, Message, Channel
from auth import hash_password, verify_password, create_token, decode_token

# Tabellen in der DB anlegen (falls noch nicht vorhanden)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HTLcord", version="0.1.0")

# Statische Dateien (HTML/CSS/JS) aus dem static/ Ordner bereitstellen
app.mount("/static", StaticFiles(directory="static"), name="static")


# -- Pydantic Schemas (Datenstrukturen für Requests) ----------

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str


# -- REST Endpunkte --------------------------------------------

@app.get("/", response_class=HTMLResponse)
def root():
    """Startseite - lädt das Frontend."""
    # TODO: index.html aus static/ zurückgeben
    return "<h1>HTLcord läuft!</h1><p><a href='/docs'>API Docs</a></p>"


@app.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Neuen User registrieren.
    1. Prüfen ob Username schon existiert
    2. Passwort hashen
    3. User in DB speichern
    4. JWT Token zurückgeben
    """
    # TODO: implementieren
    pass


@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    User einloggen.
    1. User in DB suchen
    2. Passwort prüfen
    3. JWT Token zurückgeben
    """
    # TODO: implementieren
    pass


@app.get("/channels")
def get_channels(db: Session = Depends(get_db)):
    """Alle verfügbaren Channels zurückgeben."""
    # TODO: channels aus DB laden und zurückgeben
    return {"channels": ["allgemein", "random"]}


@app.get("/messages/{channel}")
def get_messages(channel: str, db: Session = Depends(get_db)):
    """
    Nachrichtenverlauf eines Channels laden.
    URL-Beispiel: GET /messages/allgemein
    """
    # TODO: Nachrichten aus DB laden, nach Timestamp sortieren
    return {"messages": []}


# -- WebSocket -------------------------------------------------

# Speichert alle aktiven WebSocket-Verbindungen pro Channel
# Format: {"allgemein": [websocket1, websocket2], "random": [...]}
active_connections: dict = {}


@app.websocket("/ws/{channel}")
async def websocket_chat(channel: str, websocket: WebSocket, token: str = ""):
    """
    WebSocket-Endpunkt für Echtzeit-Chat.
    
    Verbinden:       ws://localhost:8000/ws/allgemein?token=JWT_TOKEN
    Nachricht senden: {"content": "Hallo!"}
    Nachricht empfangen: {"username": "Max", "content": "Hallo!", "timestamp": "14:22"}
    """
    # TODO:
    # 1. Token prüfen → username holen
    # 2. websocket.accept()
    # 3. Verbindung in active_connections eintragen
    # 4. Loop: receive_text() → an alle senden
    # 5. Bei Disconnect: aus active_connections entfernen
    await websocket.accept()
    await websocket.send_text(json.dumps({"info": "WebSocket noch nicht implementiert"}))
