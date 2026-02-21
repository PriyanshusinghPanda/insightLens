import os
import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from dotenv import load_dotenv

load_dotenv()

client = None

def init_db():
    global client
    if client is not None:
        return

    MONGO_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
    
    # Initialize Motor Async MongoDB Client with certifi for linux/render SSL resolution
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())

async def get_db():
    init_db()
    # Return the specific database instance
    db = client.insightlens
    return db