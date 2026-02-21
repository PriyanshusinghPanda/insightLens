import asyncio, os
from dotenv import load_dotenv
load_dotenv()
from app.database import get_db

async def upgrade_users():
    db = await get_db()
    result = await db.users.update_many({}, {"$set": {"role": "admin"}})
    print(f"Upgraded {result.modified_count} users to admin!")

asyncio.run(upgrade_users())
