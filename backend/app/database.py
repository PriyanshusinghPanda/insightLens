import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

load_dotenv()

engine = None
SessionLocal = None
Base = declarative_base()

def init_db():
    global engine, SessionLocal
    if engine is not None:
        return

    TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL") or os.getenv("DATABASE_URL")
    TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

    if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
        # The sqlalchemy-libsql driver expects 'sqlite+libsql://'
        # We strip the existing protocol and prepended the correct one
        clean_url = TURSO_DATABASE_URL
        if "://" in clean_url:
            clean_url = clean_url.split("://")[1]
        
        db_url = f"sqlite+libsql://{clean_url}"

        engine = create_engine(
            db_url,
            connect_args={
                "auth_token": TURSO_AUTH_TOKEN,
                "check_same_thread": False,
            },
            echo=False
        )
    else:
        # Fallback for local development
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