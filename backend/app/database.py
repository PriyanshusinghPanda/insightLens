import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL") or os.getenv("DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
    # Convert libsql:// to sqlite+libsql:// for the SQLAlchemy dialect
    url = TURSO_DATABASE_URL.replace("libsql://", "sqlite+libsql://")

    # The query param specifically needs to be just `authToken` for standard sqlalchemy-libsql to work correctly.
    engine = create_engine(
        f"{url}/?authToken={TURSO_AUTH_TOKEN}",
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