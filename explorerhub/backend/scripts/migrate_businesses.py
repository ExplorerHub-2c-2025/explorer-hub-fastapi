"""
Migration script to add missing fields to existing business documents
"""
import asyncio
from datetime import datetime
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


async def migrate_businesses():
    """Add missing required fields to existing business documents"""
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    # Find all businesses that are missing the required fields
    businesses = await db.businesses.find({}).to_list(length=None)
    
    updated_count = 0
    for business in businesses:
        update_fields = {}
        
        if "rating" not in business:
            update_fields["rating"] = 0.0
        if "views" not in business:
            update_fields["views"] = 0
        if "review_count" not in business:
            update_fields["review_count"] = 0
        if "created_at" not in business:
            update_fields["created_at"] = datetime.utcnow()
        if "is_active" not in business:
            update_fields["is_active"] = True
        
        if update_fields:
            await db.businesses.update_one(
                {"_id": business["_id"]},
                {"$set": update_fields}
            )
            updated_count += 1
            print(f"Updated business: {business.get('name', 'Unknown')} (ID: {business.get('id', 'N/A')})")
    
    print(f"\nMigration completed! Updated {updated_count} businesses.")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_businesses())
