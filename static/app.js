// app.js – Frontend JavaScript für HTLcord
// Kommuniziert mit dem FastAPI-Backend über REST und WebSocket

let token    = null;   // JWT Token nach dem Login
let username = null;   // eingeloggter Benutzername
let socket   = null;   // aktive WebSocket-Verbindung
let currentChannel = "allgemein";


// ── Auth Funktionen ───────────────────────────────────────────

async function register() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    // POST /register mit JSON Body
    const response = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: user, password: pass})
    });

    // TODO: Antwort prüfen, bei Erfolg einloggen, bei Fehler Meldung zeigen
    const data = await response.json();
    console.log("Register Antwort:", data);
}


async function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    // TODO: POST /login aufrufen
    // Bei Erfolg: token und username speichern, Chat-Screen anzeigen
    // Bei Fehler: Fehlermeldung in #login-error anzeigen
}


// ── Chat Funktionen ───────────────────────────────────────────

function joinChannel(channelName) {
    currentChannel = channelName;

    // Alte WebSocket-Verbindung schließen
    if (socket) socket.close();

    // Neue WebSocket-Verbindung öffnen
    // Token wird als URL-Parameter mitgeschickt
    socket = new WebSocket(`ws://localhost:8000/ws/${channelName}?token=${token}`);

    socket.onopen = () => {
        console.log("Verbunden mit #" + channelName);
        // TODO: Nachrichtenverlauf über REST laden
    };

    socket.onmessage = (event) => {
        // Nachricht empfangen → in Chat anzeigen
        const msg = JSON.parse(event.data);
        addMessageToChat(msg.username, msg.content, msg.timestamp);
    };

    socket.onclose = () => {
        console.log("Verbindung getrennt");
    };
}


function sendMessage() {
    const input = document.getElementById("message-input");
    const text  = input.value.trim();

    if (!text || !socket) return;

    // Nachricht über WebSocket senden
    socket.send(JSON.stringify({content: text}));
    input.value = "";
}


function addMessageToChat(author, text, time) {
    const container = document.getElementById("messages");

    // Neues div-Element für die Nachricht erstellen
    const div = document.createElement("div");
    div.className = "message";
    div.innerHTML = `
        <span class="author">${author}</span>
        <span class="time">${time}</span>
        <div class="text">${text}</div>
    `;

    container.appendChild(div);
    // Automatisch nach unten scrollen
    container.scrollTop = container.scrollHeight;
}


// Enter-Taste zum Senden
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("message-input");
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});
