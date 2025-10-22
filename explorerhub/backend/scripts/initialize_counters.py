"""
Migration script to initialize counters for sequential IDs
Run this script once before using the new ID system
"""
import asyncio
import sys
import os

# Add parent directory to path to import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from config import settings


async def initialize_counters():
    """Initialize counters for all collections"""
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    collections = ["users", "businesses", "reviews", "trips"]
    
    for collection_name in collections:
        # Check if counter already exists
        existing_counter = await db.counters.find_one({"collection_name": collection_name})
        
        if existing_counter:
            print(f"Counter for {collection_name} already exists with value: {existing_counter['sequence_value']}")
        else:
            # Initialize counter starting at 1
            await db.counters.insert_one({
                "collection_name": collection_name,
                "sequence_value": 0
            })
            print(f"Initialized counter for {collection_name} at 0")
    
    client.close()
    print("\nCounter initialization complete!")


if __name__ == "__main__":
    asyncio.run(initialize_counters())
