import pandas as pd
import asyncio
from app import database

async def seed():
    print("Connecting to MongoDB...")
    await database.get_db()
    db = database.client.insightlens
    
    print("Cleaning old data...")
    await db.products.drop()
    await db.reviews.drop()

    df = pd.read_csv("amazon_clean.csv")
    
    product_map = {}
    current_product_idx = 1
    
    print("Inserting data...")
    for _, row in df.iterrows():
        product_str_id = str(row["product_id"])
        product_name = str(row["product_name"])
        category = str(row["category"])
        rating = float(row["rating"])
        review_text = str(row["review_text"])
        
        # Create product only once
        if product_str_id not in product_map:
            product_doc = {
                "id": current_product_idx, # Int for frontend compatibility
                "name": product_name,
                "category": category
            }
            await db.products.insert_one(product_doc)
            product_map[product_str_id] = current_product_idx
            current_product_idx += 1
            
        review_doc = {
            "product_id": product_map[product_str_id],
            "review_text": review_text,
            "rating": rating,
            "sentiment": "happy" if rating >= 4 else "unhappy"
        }
        await db.reviews.insert_one(review_doc)

    print("Database seeded successfully")

if __name__ == "__main__":
    asyncio.run(seed())