# models.py
# Datenbankmodelle = Python-Klassen die Tabellen darstellen.
# Jede Klasse = eine Tabelle, jede Variable = eine Spalte.

from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base


class User(Base):
    """
    Tabelle: users
    Speichert alle registrierten Benutzer.
    """
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True)  # automatische ID
    username = Column(String, unique=True)         # darf nicht doppelt vorkommen
    password = Column(String)                      # bcrypt-Hash (nie Klartext!)


class Message(Base):
    """
    Tabelle: messages
    Speichert alle gesendeten Nachrichten.
    """
    __tablename__ = "messages"

    id        = Column(Integer, primary_key=True)
    channel   = Column(String)                          # z.B. "allgemein"
    username  = Column(String)                          # wer hat geschrieben
    content   = Column(String)                          # der Nachrichtentext
    timestamp = Column(DateTime, default=datetime.utcnow)  # wann


class Channel(Base):
    """
    Tabelle: channels
    Speichert die verfügbaren Channels.
    """
    __tablename__ = "channels"

    id   = Column(Integer, primary_key=True)
    name = Column(String, unique=True)   # z.B. "allgemein", "random"
