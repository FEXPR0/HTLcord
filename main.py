from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
from datetime import datetime

#sqlalchemy imports
from database import engine, get_db, Base
from models import User, Message
Base.metadata.create_all(bind=engine)


app = FastAPI(title="HTLcord", version="0.1.0")
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

    try:
        while True:
            rawData = await websocket.receive_text()
            data = json.loads(rawData)
            print(f"Received data: {rawData}")

            if data["type"] == "join":
                username = data["username"]
                connected_clients[websocket] = username
                username_to_ws[username] = websocket
                print(f"{username} connected")

                #save User in DB
                db = get_db()
                if not db.query(User).filter(User.username == username).first():
                    db.add(User(username=username))
                    db.commit()
                db.close()
                

            elif data["type"] == "message" and username:
                broadcastMessage = json.dumps({"type": "message", "username": username, "message": data["message"], "timestamp": str(datetime.now())})
                for client in connected_clients:
                    await client.send_text(broadcastMessage)
                #save message in DB
                db = get_db()
                db.add(Message(username=username, message=data["message"], type="message"))
                db.commit()
                db.close()
                

            elif data["type"] == "dm" and username:
                unicastMessage = json.dumps({"type": "dm", "username": username, "message": data["message"], "timestamp": str(datetime.now())})
                await username_to_ws[data["username"]].send_text(unicastMessage)
                #save DM in DB
                db = get_db()
                db.add(Message(username=username, message=data["message"], type="dm"))
                db.commit()
                db.close()


            elif data["type"] == "request" and data["content"] == "log":
                db = get_db()
                rows = db.query(Message).filter(Message.type == "message").all()
                messages = [{"type": "message", "username": r.username, "message": r.message, "timestamp": str(r.timestamp)} for r in rows]
                db.close()
                await websocket.send_text(json.dumps({"type": "log", "messages": messages}))
            
 
            # elif data["type"] == "request" and data["content"] == "dmlog":
            #     db = get_db()
            #     rows = db.query(Message).filter(Message.type == "dm").all()     #<- need to change filter!
            #     messages = [{"type": "dm", "username": r.username, "message": r.message, "timestamp": str(r.timestamp)} for r in rows]
            #     db.close()
            #     await websocket.send_text(json.dumps({"type": "dmlog", "messages": messages}))


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