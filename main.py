from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
from datetime import datetime
from pydantic import BaseModel
from auth import hash_password, verify_password, create_token, decode_token

#sqlalchemy imports
from database import engine, get_db, Base
from models import User, Message
Base.metadata.create_all(bind=engine)

class LoginRequest(BaseModel):
    username: str
    password: str

app = FastAPI(title="HTLcord", version="0.1.0")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_clients = {}
username_to_ws = {}


@app.post("/register")
def register(data: LoginRequest, db=Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user with hashed password
    hashed = hash_password(data.password)
    user = User(username=data.username, password=hashed)
    db.add(user)
    db.commit()
    
    return {"message": "User registered", "token": create_token(data.username)}

@app.post("/login")
def login(data: LoginRequest, db=Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "token": create_token(data.username)}

@app.websocket("/ws")
async def websocketEndpoint(websocket: WebSocket, token: str = None):
    await websocket.accept()
    try:
        username = decode_token(token)  # Verify token
        connected_clients[websocket] = username
        username_to_ws[username] = websocket
        print(f"{username} connected with token successfully")
    except:
        await websocket.close(code=1008, reason="Invalid token")
        return

    try:
        while True:
            rawData = await websocket.receive_text()
            data = json.loads(rawData)
            print(f"Received data: {rawData}")                

            if data["type"] == "message" and username:
                broadcastMessage = json.dumps({"type": "message", "username": username, "message": data["message"], "timestamp": str(datetime.now())})
                for client in connected_clients:
                    await client.send_text(broadcastMessage)
                #save message in DB
                db = get_db()
                db.add(Message(username=username, message=data["message"], type="message"))
                db.commit()
                db.close()
                

            elif data["type"] == "dm" and username:
                recipient = data.get("username")
                if not recipient:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Missing dm recipient"}))
                else:
                    unicastMessage = json.dumps({"type": "dm", "username": username, "message": data["message"], "timestamp": str(datetime.now())})
                    if recipient in username_to_ws:
                        await username_to_ws[recipient].send_text(unicastMessage)
                    else:
                        await websocket.send_text(json.dumps({"type": "error", "message": f"{recipient} is not connected. DM not delivered."}))
                    db = get_db()
                    db.add(Message(username=username, message=data["message"], type="dm", allowed_readers=json.dumps([username, recipient])))
                    db.commit()
                    db.close()
                    

            elif data["type"] == "request" and data["content"] == "log":
                db = get_db()
                rows = db.query(Message).filter(Message.type == "message").all()
                messages = [{"type": "message", "username": r.username, "message": r.message, "timestamp": str(r.timestamp)} for r in rows]
                db.close()
                await websocket.send_text(json.dumps({"type": "log", "messages": messages}))
            
 
            elif data["type"] == "request" and data["content"] == "dmlog":
                db = get_db()
                rows = db.query(Message).filter(Message.type == "dm").all()
                allowed_rows = []
                for r in rows:
                    allowed_readers = json.loads(r.allowed_readers)
                    if username in allowed_readers and data["username"] in allowed_readers:
                        allowed_rows.append(r)
                messages = [{"type": "dm", "username": r.username, "message": r.message, "timestamp": str(r.timestamp)} for r in allowed_rows]
                db.close()
                await websocket.send_text(json.dumps({"type": "dmlog", "messages": messages}))


            elif data["type"] == "request" and data["content"] == "users":
                db = get_db()
                rows = db.query(User).all()
                users = [r.username for r in rows]
                db.close()
                await websocket.send_text(json.dumps({"type": "users", "users": users}))

    except Exception as e:
        print(f"ERROR: {e}")
        if websocket in connected_clients:
            del connected_clients[websocket]

# host with uvicorn: uvicorn main:app --reload --host 0.0.0.0 --port 8084