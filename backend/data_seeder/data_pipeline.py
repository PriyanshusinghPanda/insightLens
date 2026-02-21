import pandas as pd

df = pd.read_csv("amazon.csv")

# Keep only required columns
df = df[[
    "asins",
    "name",
    "categories",
    "reviews.rating",
    "reviews.text",
    "reviews.date"
]]

# Rename columns to simpler names
df.columns = [
    "product_id",
    "product_name",
    "category",
    "rating",
    "review_text",
    "review_date"
]

# Drop missing values
df = df.dropna(subset=["rating", "review_text"])

# Reduce size (VERY IMPORTANT)
df = df.head(5000)

df.to_csv("amazon_clean.csv", index=False)

print("Clean dataset ready")