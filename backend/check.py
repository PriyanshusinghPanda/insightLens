import asyncio
import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def run():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('DATABASE_URL'))
    import certifi
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('DATABASE_URL'), tlsCAFile=certifi.where())
    
    db = client.insightlens
    
    users = await db.users.find().to_list(10)
    print("Users:")
    for u in users:
        print(f"  {u['_id']} - {u['email']} - {u['role']}")
        
    cats = await db.analyst_category.find().to_list(10)
    print("\nCategories assigned:")
    for c in cats:
        print(f"  {c}")

if __name__ == '__main__':
    asyncio.run(run())
