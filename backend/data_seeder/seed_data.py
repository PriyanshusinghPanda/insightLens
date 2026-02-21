import pandas as pd
from app.database import SessionLocal
from app.models.product import Product
from app.models.review import Review

db = SessionLocal()

df = pd.read_csv("amazon_clean.csv")

product_map = {}

for _, row in df.iterrows():

    product_id = str(row["product_id"])
    product_name = str(row["product_name"])
    category = str(row["category"])
    rating = float(row["rating"])
    review_text = str(row["review_text"])

    # Create product only once
    if product_id not in product_map:
        product = Product(
            name=product_name,
            category=category
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        product_map[product_id] = product.id

    review = Review(
        product_id=product_map[product_id],
        review_text=review_text,
        rating=rating,
        sentiment="happy" if rating >= 4 else "unhappy"
    )

    db.add(review)

db.commit()
db.close()

print("Database seeded successfully")