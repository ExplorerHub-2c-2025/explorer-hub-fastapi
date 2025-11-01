"""
Script para inicializar el contador de replies
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

async def initialize_replies_counter():
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    # Check if replies counter exists
    counter = await db.counters.find_one({"_id": "replies"})
    
    if counter is None:
        # Create the counter starting at 1
        await db.counters.insert_one({
            "_id": "replies",
            "seq": 1
        })
        print("✓ Replies counter initialized")
    else:
        print("✓ Replies counter already exists")
    
    # Also ensure all existing reviews have replies array
    result = await db.reviews.update_many(
        {"replies": {"$exists": False}},
        {"$set": {"replies": []}}
    )
    
    print(f"✓ Updated {result.modified_count} reviews with empty replies array")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(initialize_replies_counter())
