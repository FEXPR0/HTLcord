from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio, json, time
from datetime import datetime

def saveMessage(message):
    with open("messages.txt", "a", encoding="utf-8") as f:
        f.write(message + "\n")

# app mit title und version definieren
app = FastAPI(title="HTLcord", version="0.1.0")

#Statische Dateien mounten
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

connected_clients = {}
username_to_ws = {}

@app.websocket("/ws")
async def websocketEndpoint(websocket: WebSocket):
    await websocket.accept()
    username = None
    #connected_clients.append(websocket)
    
    try:
        while True:
            rawData = await websocket.receive_text()
            data = json.loads(rawData)
            print(f"Received data: {data}")  # ← hinzufügen!
            
            if data["type"] == "join":
                username = data["username"]
                connected_clients[websocket] = username
                username_to_ws[username] = websocket
                print(f"{websocket} ws as user: {username}")
                print(f"{username} connected")
                
            elif data["type"] == "message" and username:
                broadcastMessage = json.dumps({"type": "message", "username": username, "message": data["message"], "timestamp": str(datetime.now())})
                for client in connected_clients:
                    await client.send_text(broadcastMessage)
                
                print(f"Message sent: {data}")
                saveMessage(broadcastMessage)
                
            elif data["type"] == "dm" and username:
                unicastMessage = json.dumps({"type": "dm", "username": username, "message": data["message"], "timestamp": str(datetime.now())})
                await username_to_ws[data["username"]].send_text(unicastMessage)
                
            elif data["type"] == "request" and data["content"] == "log":
                try:
                    with open("messages.txt", "r", encoding="utf-8") as f:
                        lines = f.read().splitlines()
                        messages = [json.loads(line) for line in lines if line]  # ← String → Dict
                    logMessages = json.dumps({"type": "log", "messages": messages})
                except FileNotFoundError:
                    logMessages = json.dumps({"type": "log", "messages": []})
                await websocket.send_text(logMessages)
            
            elif data["type"] == "request" and data["content"] == "users":
                try:
                    with open("messages.txt", "r", encoding="utf-8") as f:
                        lines = f.read().splitlines()
                        messages = [json.loads(line) for line in lines if line]
                        # Extract unique usernames from messages
                        users = list(set(msg["username"] for msg in messages if msg.get("username")))
                    userList = json.dumps({"type": "users", "users": users})
                except FileNotFoundError:
                    userList = json.dumps({"type": "users", "users": []})
                await websocket.send_text(userList)

    except Exception as e:
        print(f"ERROR: {e}")  # ← hinzufügen!
        if websocket in connected_clients:
            del connected_clients[websocket]

#host with uvicorn: uvicorn main:app --reload --host 0.0.0.0 --port 8000