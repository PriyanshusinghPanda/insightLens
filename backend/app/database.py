import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from libsql_client import create_client_sync
from dotenv import load_dotenv

load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
    # Convert libsql:// to https:// for the client
    url = TURSO_DATABASE_URL.replace("libsql://", "https://")

    client = create_client_sync(
        url=url,
        auth_token=TURSO_AUTH_TOKEN
    )

    engine = create_engine(
        "sqlite://",
        creator=lambda: client._create_connection()
    )

else:
    # fallback local sqlite
    engine = create_engine(
        "sqlite:///./insightlens.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()