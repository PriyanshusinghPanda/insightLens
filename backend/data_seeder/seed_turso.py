import os
import pandas as pd
from app.database import SessionLocal
from app.models.product import Product
from app.models.review import Review

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "amazon_clean.csv")

print("Loading dataset...")
df = pd.read_csv(CSV_PATH).head(3000)

db = SessionLocal()

product_cache = {}
batch = []

BATCH_SIZE = 50

for i, row in df.iterrows():
    pid = str(row["product_id"])
    pname = str(row["product_name"])
    category = str(row["category"]).split(",")[0]
    rating = float(row["rating"])
    text = str(row["review_text"])

    if pid not in product_cache:
        product = Product(name=pname, category=category)
        db.add(product)
        db.commit()
        db.refresh(product)
        product_cache[pid] = product.id

    batch.append(
        Review(
            product_id=product_cache[pid],
            review_text=text,
            rating=rating,
            sentiment="happy" if rating >= 4 else "unhappy"
        )
    )

    if len(batch) >= BATCH_SIZE:
        db.bulk_save_objects(batch)
        db.commit()
        batch.clear()
        print("Inserted", i)

if batch:
    db.bulk_save_objects(batch)
    db.commit()

db.close()
print("Seeding completed!")