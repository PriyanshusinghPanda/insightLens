from app import database
from app.models import user, product, review, report, conversation

print("Connecting to Turso...")

database.init_db()

# Force connection
with database.engine.connect() as conn:
    print("Connected!")

print("Creating tables...")
database.Base.metadata.create_all(bind=database.engine)
print("Tables created successfully.")