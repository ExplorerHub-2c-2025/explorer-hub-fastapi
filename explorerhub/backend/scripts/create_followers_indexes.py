"""
Script to create indexes for the followers collection
Run this script once to optimize follower queries
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


async def create_indexes():
    """Create necessary indexes for followers collection"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    print("Creating indexes for followers collection...")
    
    # Index for finding all followers of a user
    await db.followers.create_index("following_id")
    print("✓ Created index on following_id")
    
    # Index for finding all users that a user follows
    await db.followers.create_index("follower_id")
    print("✓ Created index on follower_id")
    
    # Compound index to check if user A follows user B
    await db.followers.create_index([("follower_id", 1), ("following_id", 1)], unique=True)
    print("✓ Created compound unique index on (follower_id, following_id)")
    
    # Index for sorting by creation date
    await db.followers.create_index("created_at")
    print("✓ Created index on created_at")
    
    print("\n✅ All indexes created successfully!")
    
    # Close connection
    client.close()


if __name__ == "__main__":
    asyncio.run(create_indexes())
