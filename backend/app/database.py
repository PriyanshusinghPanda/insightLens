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
        url = TURSO_DATABASE_URL.replace("libsql://", "sqlite+libsql://")

        import urllib.parse
        parsed_url = urllib.parse.urlparse(url)
        db_url = f"sqlite+libsql://:{TURSO_AUTH_TOKEN}@{parsed_url.netloc}/?secure=true"

        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
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
