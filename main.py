from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio

# app mit title und version definieren
app = FastAPI(title="HTLcord", version="0.1.0")

#Statische Dateien mounten
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

connected_clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            #an ALLE Clients (inkl. Sender)
            for client in connected_clients:
                await client.send_text(data)
                print(data)
                    
    except:
        # Sicherheitscheck beim Entfernen
        if websocket in connected_clients:
            connected_clients.remove(websocket)