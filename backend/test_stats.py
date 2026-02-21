import asyncio, os
from dotenv import load_dotenv
load_dotenv()
from app.database import get_db
from app.services.analytics_service import get_dashboard_stats

async def test_stats():
    db = await get_db()
    stats = await get_dashboard_stats(db, user_id=1, role="admin")
    print("STATS CATEGORIES:", len(stats["category_performance"]))
    print("TOP PRODUCTS:", len(stats["top_products"]))
    print("BAD PRODUCTS:", len(stats["bad_products"]))

asyncio.run(test_stats())
