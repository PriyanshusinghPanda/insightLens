import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from libsql_client import create_client_sync

db_url = os.getenv("TURSO_DATABASE_URL")
db_token = os.getenv("TURSO_AUTH_TOKEN")

if db_url and db_token:
    if db_url.startswith("libsql://"):
        url = db_url.replace("libsql://", "https://")
    elif not db_url.startswith("https://"):
        url = f"https://{db_url}"
    else:
        url = db_url

    engine = create_engine(
        "sqlite://", 
        creator=lambda: create_client_sync(url, auth_token=db_token)._create_connection()
    )
else:
    DATABASE_URL = "sqlite:///./insightlens.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()