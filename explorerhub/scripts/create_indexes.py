"""
Create database indexes for optimal query performance
Run this script after setting up the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings


async def create_indexes():
    """Create indexes for all collections"""
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    print("Creating indexes...")
    
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    print("✓ Created unique index on users.email")
    
    # Businesses collection indexes
    await db.businesses.create_index("category")
    await db.businesses.create_index("owner_id")
    await db.businesses.create_index([("location.city", 1), ("category", 1)])
    await db.businesses.create_index("rating")
    print("✓ Created indexes on businesses collection")
    
    # Reviews collection indexes
    await db.reviews.create_index("business_id")
    await db.reviews.create_index("user_id")
    await db.reviews.create_index([("business_id", 1), ("created_at", -1)])
    print("✓ Created indexes on reviews collection")
    
    # Trips collection indexes
    await db.trips.create_index("user_id")
    await db.trips.create_index([("user_id", 1), ("start_date", -1)])
    print("✓ Created indexes on trips collection")
    
    print("\nAll indexes created successfully!")
    client.close()


if __name__ == "__main__":
    asyncio.run(create_indexes())
