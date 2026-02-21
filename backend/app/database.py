import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

db_url = os.getenv("TURSO_DATABASE_URL")
db_token = os.getenv("TURSO_AUTH_TOKEN")

if db_url and db_token:
    if db_url.startswith("https://"):
        db_url = db_url.replace("https://", "libsql://", 1)
    DATABASE_URL = f"sqlite+{db_url}?auth_token={db_token}"
else:
    DATABASE_URL = "sqlite:///./insightlens.db"

if "libsql" in DATABASE_URL:
    engine = create_engine(DATABASE_URL)
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()