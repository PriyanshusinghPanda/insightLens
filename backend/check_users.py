import asyncio, os
from dotenv import load_dotenv
load_dotenv()
from app.database import get_db

async def check_users():
    db = await get_db()
    users = await db.users.find({}).to_list(100)
    print("Users in DB:", users)

asyncio.run(check_users())
