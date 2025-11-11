#!/usr/bin/env python3
"""
Script to migrate business category field from string to array and translate to Spanish
"""
import asyncio
from database import Database

# Mapping from English to Spanish categories
CATEGORY_MAPPING = {
    "Restaurant": "Restaurante",
    "Activity": "Actividad", 
    "Attraction": "Atracción",
    "Nature": "Naturaleza",
    "Cultural": "Cultural",
    "Entertainment": "Entretenimiento",
    "Shopping": "Compras",
    "Nightlife": "Vida Nocturna",
    "Accommodation": "Alojamiento",
    "Wellness": "Bienestar",
    "Historical": "Histórico",
    "Family": "Familiar",
    # Also handle lowercase versions
    "restaurant": "Restaurante",
    "activity": "Actividad",
    "attraction": "Atracción", 
    "nature": "Naturaleza",
    "cultural": "Cultural",
    "entertainment": "Entretenimiento",
    "shopping": "Compras",
    "nightlife": "Vida Nocturna",
    "accommodation": "Alojamiento",
    "wellness": "Bienestar",
    "historical": "Histórico",
    "family": "Familiar"
}

async def migrate_business_categories():
    await Database.connect_db()
    db = Database.get_db()

    print("Starting business category migration and translation...")

    # Find all businesses with 'category' field (old format)
    businesses = await db.businesses.find({"category": {"$exists": True}}).to_list(length=None)
    print(f"Found {len(businesses)} businesses with old 'category' field to migrate")

    migrated_count = 0
    for business in businesses:
        business_id = business.get("id")
        category = business.get("category")

        if category:
            # Translate category to Spanish if needed
            translated_category = CATEGORY_MAPPING.get(category, category)
            categories = [translated_category]

            # Update the business
            await db.businesses.update_one(
                {"id": business_id},
                {
                    "$set": {"categories": categories},
                    "$unset": {"category": ""}
                }
            )

            print(f"Migrated business {business_id} ({business.get('name')}): '{category}' -> '{translated_category}'")
            migrated_count += 1

    # Also check for businesses that already have categories array but might have English values
    businesses_with_categories = await db.businesses.find({"categories": {"$exists": True}}).to_list(length=None)
    print(f"\nChecking {len(businesses_with_categories)} businesses with categories array...")

    updated_count = 0
    for business in businesses_with_categories:
        business_id = business.get("id")
        categories = business.get("categories", [])
        
        if categories and isinstance(categories, list):
            # Check if any categories need translation
            translated_categories = []
            needs_update = False
            
            for cat in categories:
                if isinstance(cat, str):
                    translated_cat = CATEGORY_MAPPING.get(cat, cat)
                    translated_categories.append(translated_cat)
                    if translated_cat != cat:
                        needs_update = True
                else:
                    translated_categories.append(cat)
            
            if needs_update:
                await db.businesses.update_one(
                    {"id": business_id},
                    {"$set": {"categories": translated_categories}}
                )
                print(f"Updated business {business_id} ({business.get('name')}): {categories} -> {translated_categories}")
                updated_count += 1

    print(f"\nMigration completed!")
    print(f"- Migrated {migrated_count} businesses from 'category' to 'categories'")
    print(f"- Updated {updated_count} businesses with translated categories")

    # Verify the migration
    print("\nVerifying migration...")
    all_businesses = await db.businesses.find({}).to_list(length=None)
    businesses_with_categories = [b for b in all_businesses if b.get("categories")]
    businesses_with_old_category = [b for b in all_businesses if b.get("category")]
    
    print(f"Total businesses: {len(all_businesses)}")
    print(f"Businesses with categories field: {len(businesses_with_categories)}")
    print(f"Businesses with old category field: {len(businesses_with_old_category)}")

    # Show sample of categories
    if businesses_with_categories:
        sample_categories = set()
        for b in businesses_with_categories[:10]:  # Check first 10
            cats = b.get("categories", [])
            if cats:
                sample_categories.update(cats)
        print(f"Sample categories found: {list(sample_categories)}")

    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(migrate_business_categories())
