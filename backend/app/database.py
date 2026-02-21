import os
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

client = None

def init_db():
    global client
    if client is not None:
        return

    MONGO_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
    
    # Initialize Motor Async MongoDB Client
    client = AsyncIOMotorClient(MONGO_URL)

async def get_db():
    init_db()
    # Return the specific database instance
    db = client.insightlens
    return db