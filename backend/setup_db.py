import asyncio
from app import database

async def setup():
    print("Connecting to MongoDB...")
    await database.get_db() # Initializes the client
    
    db = database.client.insightlens
    
    print("Creating indexes...")
    # Ensure emails are unique
    await db.users.create_index("email", unique=True)
    
    # Optional: indexes for performance on lookups
    await db.reviews.create_index("product_id")
    await db.products.create_index("category")
    
    print("Indexes created successfully.")

if __name__ == "__main__":
    asyncio.run(setup())