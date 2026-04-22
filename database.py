# database.py
# Hier wird die Datenbankverbindung eingerichtet.
# SQLAlchemy ist ein ORM (Object Relational Mapper) –
# damit schreibt man Python-Klassen statt SQL-Tabellen.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Datenbankdatei: htlcord.db (wird automatisch angelegt)
DATABASE_URL = "sqlite:///./htlcord.db"

# Engine = Verbindung zur Datenbank
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # nötig für SQLite + FastAPI
)

# SessionLocal = Fabrik für DB-Sessions (eine pro Request)
SessionLocal = sessionmaker(bind=engine)

# Base = Basisklasse für alle Tabellen-Modelle (siehe models.py)
Base = declarative_base()


def get_db():
    """
    Dependency-Funktion für FastAPI.
    Gibt eine DB-Session zurück und schließt sie nach dem Request.
    Wird in den Routen so verwendet:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
