import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL") or os.getenv("DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
    url = TURSO_DATABASE_URL.replace("libsql://", "sqlite+libsql://")

    # SQLAlchemy allows passing the auth token as a password in the URL
    # format: sqlite+libsql://:{token}@{hostname}:443/?secure=true
    import urllib.parse
    parsed_url = urllib.parse.urlparse(url)
    
    # We construct the URL with the token as the password
    # The hostname contains the actual Turso DB url
    db_url = f"sqlite+libsql://:{TURSO_AUTH_TOKEN}@{parsed_url.netloc}/?secure=true"

    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )

else:
    # fallback local sqlite
    engine = create_engine(
        "sqlite:///./insightlens.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()