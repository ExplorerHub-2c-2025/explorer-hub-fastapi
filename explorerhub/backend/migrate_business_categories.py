#!/usr/bin/env python3
"""
Script to migrate business category field from string to array
"""
import asyncio
from database import Database

async def migrate_business_categories():
    await Database.connect_db()
    db = Database.get_db()

    print("Starting business category migration...")

    # Find all businesses with 'category' field
    businesses = await db.businesses.find({"category": {"$exists": True}}).to_list(length=None)

    print(f"Found {len(businesses)} businesses to migrate")

    for business in businesses:
        business_id = business.get("id")
        category = business.get("category")

        if category:
            # Convert category string to categories array
            categories = [category]

            # Update the business
            await db.businesses.update_one(
                {"id": business_id},
                {
                    "$set": {"categories": categories},
                    "$unset": {"category": ""}
                }
            )

            print(f"Migrated business {business_id} ({business.get('name')}): '{category}' -> {categories}")

    print("Migration completed!")

    # Verify the migration
    print("\nVerifying migration...")
    migrated_businesses = await db.businesses.find({"categories": {"$exists": True}}).to_list(length=None)
    print(f"Businesses with categories field: {len(migrated_businesses)}")

    old_businesses = await db.businesses.find({"category": {"$exists": True}}).to_list(length=None)
    print(f"Businesses with old category field: {len(old_businesses)}")

    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(migrate_business_categories())
