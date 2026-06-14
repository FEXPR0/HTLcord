# HTLcord 💬

Ein browserbasierter Gruppen-Chat inspiriert von Discord – entwickelt als Schulprojekt an der HTL.

Echtzeit-Kommunikation über WebSockets, Benutzerkonten mit JWT-Authentifizierung und ein Python/FastAPI-Backend mit SQLite-Datenbank.

Live Demo: https://htlcord.app

---

## Features

- Echtzeit-Chat über WebSockets
- Benutzerregistrierung & Login (JWT)
- Mehrere Channels
- Online-Status anderer Benutzer
- Nachrichtenverlauf
- Läuft komplett im Browser – keine Installation nötig
- Live gehostet auf DigitalOcean

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| WebSockets | FastAPI WebSocket Support |
| Datenbank | SQLite |
| ORM | SQLAlchemy |
| Auth | JWT (python-jose), Passwort-Hashing (passlib/bcrypt) |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Hosting | Digital Ocean (htlcord.app) |
| Domain | name.com |
| Versionsverwaltung | Git / GitHub |

---

## Projektstruktur

```
HTLcord/
├── main.py               # FastAPI App, Routen, WebSocket-Handler
├── models.py             # Datenbankmodelle (User, Message)
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

### Voraussetzungen
- Python 3.11+
- pip (Python Package Manager)
- Git

### 1. Repository klonen

```bash
git clone https://github.com/FEXPR0/HTLcord.git
cd HTLcord
```

### 2. Virtuelle Umgebung erstellen

```bash
python -m venv venv

# Unter Windows:
venv\Scripts\activate

# Unter macOS/Linux:
source venv/bin/activate
```

### 3. Abhängigkeiten installieren

```bash
pip install -r requirements.txt
```

### 4. Umgebungsvariablen einrichten

Erstelle `.env` mit folgenden Einstellungen für lokale Entwicklung:

```env
SECRET_KEY=dev-secret-key-for-local-testing
DATABASE_URL=sqlite:///./htlcord.db
ALLOWED_ORIGINS=http://localhost:8000
ENVIRONMENT=development
```

### 5. Server starten

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Im Browser öffnen

```
http://localhost:8000
```

---

## User Stories

- Als Benutzer kann ich mich registrieren und einloggen.
- Als Benutzer kann ich in einem Channel Nachrichten in Echtzeit senden und empfangen.
- Als Benutzer sehe ich, welche anderen Benutzer gerade online sind.
- Als Benutzer kann ich den Nachrichtenverlauf eines Channels laden.
- Als Benutzer kann ich zwischen verschiedenen Channels wechseln.

---

## Team

Schulprojekt – HTL Abschlussprojekt

---

## Lizenz

Nur für schulische Zwecke.
