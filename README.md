# HTLcord 💬

Ein browserbasierter Gruppen-Chat inspiriert von Discord – entwickelt als Schulprojekt an der HTL.

Echtzeit-Kommunikation über WebSockets, Benutzerkonten mit JWT-Authentifizierung und ein Python/FastAPI-Backend mit SQLite-Datenbank.

---

## Features

- Echtzeit-Chat über WebSockets
- Benutzerregistrierung & Login (JWT)
- Mehrere Channels / Räume
- Online-Status anderer Benutzer
- Nachrichtenverlauf
- Läuft komplett im Browser – keine Installation nötig

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| WebSockets | FastAPI WebSocket Support |
| Datenbank | SQLite (lokal) / PostgreSQL (Produktion) |
| ORM | SQLAlchemy |
| Auth | JWT (python-jose), Passwort-Hashing (passlib/bcrypt) |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Hosting | HTL-Server oder Render.com / Railway.app |
| Versionsverwaltung | Git / GitHub |

---

## Projektstruktur

```
HTLcord/
├── main.py               # FastAPI App, Routen, WebSocket-Handler
├── models.py             # Datenbankmodelle (User, Message, Channel)
├── auth.py               # JWT Login/Register Logik
├── database.py           # SQLAlchemy Setup
├── requirements.txt      # Python-Abhängigkeiten
├── static/
│   ├── index.html        # Frontend HTML
│   ├── style.css         # Styling
│   └── app.js            # WebSocket Client JS
└── README.md
```

---

## Lokales Setup

### 1. Repository klonen

```bash
git clone https://github.com/EUER-USERNAME/HTLcord.git
cd HTLcord
```

### 2. Abhängigkeiten installieren

```bash
pip install fastapi uvicorn sqlalchemy python-jose passlib[bcrypt] websockets
```

### 3. Server starten

```bash
uvicorn main:app --reload
```

### 4. Im Browser öffnen

```
http://localhost:8000
```

---

## User Stories

- Als Benutzer kann ich mich registrieren und einloggen.
- Als Benutzer kann ich einem Channel beitreten und Nachrichten in Echtzeit senden und empfangen.
- Als Benutzer sehe ich, welche anderen Benutzer gerade online sind.
- Als Benutzer kann ich den Nachrichtenverlauf eines Channels laden.
- Als Benutzer kann ich zwischen verschiedenen Channels wechseln.

---

## Team

Schulprojekt – HTL Abschlussprojekt

---

## Lizenz

Nur für schulische Zwecke.
