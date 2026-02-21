import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

engine = None
SessionLocal = None

def init_db():
    global engine, SessionLocal
    if engine is not None:
        return

    TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL") or os.getenv("DATABASE_URL")
    TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

    if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
        # Force the Secure WebSocket protocol (wss://) to prevent HTTP 405 Method Not Allowed errors
        if TURSO_DATABASE_URL.startswith("libsql://"):
            db_url = TURSO_DATABASE_URL.replace("libsql://", "sqlite+wss://")
        elif TURSO_DATABASE_URL.startswith("https://"):
            db_url = TURSO_DATABASE_URL.replace("https://", "sqlite+wss://")
        else:
            db_url = TURSO_DATABASE_URL

        # Pass the auth token directly to the underlying DBAPI driver
        engine = create_engine(
            db_url,
            connect_args={
                "check_same_thread": False,
                "auth_token": TURSO_AUTH_TOKEN
            }
        )
    else:
        engine = create_engine(
            "sqlite:///./insightlens.db",
            connect_args={"check_same_thread": False}
        )

    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base = declarative_base()
