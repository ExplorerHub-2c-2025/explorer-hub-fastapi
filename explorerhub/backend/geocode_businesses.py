"""
Script to geocode all existing businesses that don't have coordinates
"""
import asyncio
from database import Database
from services.geocoding_service import GeocodingService

async def geocode_all_businesses():
    """Geocode all businesses that don't have latitude/longitude"""
    await Database.connect_db()
    db = Database.get_db()
    
    # Get all businesses
    businesses = await db.businesses.find({}).to_list(length=None)
    
    print(f"Found {len(businesses)} businesses")
    
    updated_count = 0
    skipped_count = 0
    
    for business in businesses:
        business_id = business.get("id")
        business_name = business.get("name")
        location = business.get("location", {})
        
        # Check if already has coordinates
        if location.get("latitude") and location.get("longitude"):
            print(f"  ⏩ Skipped '{business_name}' (already has coordinates)")
            skipped_count += 1
            continue
        
        # Check if has address and city
        if not location.get("address") or not location.get("city"):
            print(f"  ⚠️ Skipped '{business_name}' (missing address or city)")
            skipped_count += 1
            continue
        
        print(f"\n📍 Geocoding '{business_name}'...")
        print(f"   Address: {location.get('address')}, {location.get('city')}")
        
        # Geocode
        lat, lon = await GeocodingService.geocode_address(
            address=location["address"],
            city=location["city"],
            state=location.get("state"),
            country=location.get("country")
        )
        
        if lat and lon:
            # Update business with coordinates
            await db.businesses.update_one(
                {"id": business_id},
                {"$set": {
                    "location.latitude": lat,
                    "location.longitude": lon
                }}
            )
            print(f"   ✅ Updated: ({lat}, {lon})")
            updated_count += 1
            
            # Small delay to respect Nominatim rate limits (1 request per second)
            await asyncio.sleep(1.1)
        else:
            print(f"   ❌ Could not geocode")
    
    print(f"\n" + "="*60)
    print(f"✅ Geocoding completed!")
    print(f"   Updated: {updated_count} businesses")
    print(f"   Skipped: {skipped_count} businesses")
    print(f"=" * 60)
    
    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(geocode_all_businesses())
