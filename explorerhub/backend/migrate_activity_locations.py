"""
Migration script to add location data to existing trip activities
"""
import asyncio
from database import Database

async def migrate_activity_locations():
    """Add location data to all existing trip activities"""
    # Connect to database
    await Database.connect_db()
    db = Database.get_db()
    
    # Get all trips with activities
    trips = await db.trips.find({"activities": {"$exists": True, "$ne": []}}).to_list(length=None)
    
    print(f"Found {len(trips)} trips with activities")
    
    updated_count = 0
    for trip in trips:
        trip_id = trip.get("id")
        activities = trip.get("activities", [])
        
        updated_activities = []
        has_changes = False
        for activity in activities:
            business_id = activity.get("business_id")
            
            # Get business data
            business = await db.businesses.find_one({"id": business_id})
            
            if business:
                # Get location from business (it's a nested object)
                business_location = business.get("location", {})
                activity["location"] = {
                    "address": business_location.get("address"),
                    "city": business_location.get("city"),
                    "lat": business_location.get("latitude"),
                    "lng": business_location.get("longitude")
                }
                print(f"  - Updated activity '{activity.get('business_name')}' in trip {trip_id}")
                print(f"    Location: {activity['location']['city']}, {activity['location']['address']}")
                has_changes = True
            else:
                print(f"  - Warning: Business {business_id} not found for activity in trip {trip_id}")
            
            updated_activities.append(activity)
        
        # Update trip with enriched activities only if there were changes
        if has_changes:
            await db.trips.update_one(
                {"id": trip_id},
                {"$set": {"activities": updated_activities}}
            )
            updated_count += 1
    
    print(f"\n✅ Migration completed! Updated {updated_count} trips")
    
    # Close database connection
    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(migrate_activity_locations())
