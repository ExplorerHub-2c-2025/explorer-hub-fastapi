import asyncio
from database import Database
from models.trip import TripVisibility

async def migrate_trip_visibility():
    """Migrate existing trips from is_public boolean to visibility enum"""
    await Database.connect_db()
    db = Database.get_db()

    # Find all trips that don't have visibility set
    trips_to_migrate = await db.trips.find({"visibility": {"$exists": False}}).to_list(length=1000)

    print(f"Found {len(trips_to_migrate)} trips to migrate")

    for trip in trips_to_migrate:
        trip_id = trip["id"]
        is_public = trip.get("is_public", False)

        # Convert is_public to visibility
        if is_public:
            new_visibility = TripVisibility.public
        else:
            new_visibility = TripVisibility.private

        # Update the trip
        await db.trips.update_one(
            {"id": trip_id},
            {
                "$set": {"visibility": new_visibility},
                "$unset": {"is_public": ""}  # Remove the old field
            }
        )

        print(f"Migrated trip {trip_id}: is_public={is_public} -> visibility={new_visibility}")

    print("Migration completed!")

    # Verify migration
    trips = await db.trips.find({}).limit(5).to_list(length=5)
    print("\nVerification - First 5 trips:")
    for t in trips:
        print(f"ID: {t.get('id')}, visibility: {t.get('visibility')}, is_public: {t.get('is_public')}")

    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(migrate_trip_visibility())
