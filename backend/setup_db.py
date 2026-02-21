from app.database import engine, Base
from app.models import user, product, review, report, conversation

print("Connecting to Turso...")

# Force connection
with engine.connect() as conn:
    print("Connected!")

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully.")