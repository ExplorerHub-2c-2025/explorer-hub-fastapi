from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from database import get_database
from models.trip import TripCreate, Trip, TripInDB, TripActivity
from auth import get_current_active_user
from models.user import UserInDB

router = APIRouter(prefix="/api/trips", tags=["trips"])


@router.post("/", response_model=Trip, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip: TripCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new trip"""
    trip_dict = trip.model_dump()
    trip_dict["user_id"] = str(current_user.id)
    trip_dict["activities"] = []
    trip_dict["created_at"] = datetime.utcnow()
    trip_dict["updated_at"] = datetime.utcnow()
    
    result = await db.trips.insert_one(trip_dict)
    created_trip = await db.trips.find_one({"_id": result.inserted_id})
    
    return Trip(**{**created_trip, "id": str(created_trip["_id"])})


@router.get("/", response_model=List[Trip])
async def get_my_trips(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all trips for current user"""
    cursor = db.trips.find({"user_id": str(current_user.id)}).sort("start_date", -1)
    trips = await cursor.to_list(length=100)
    
    return [Trip(**{**t, "id": str(t["_id"])}) for t in trips]


@router.get("/{trip_id}", response_model=Trip)
async def get_trip(
    trip_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get a specific trip"""
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this trip")
    
    return Trip(**{**trip, "id": str(trip["_id"])})


@router.put("/{trip_id}", response_model=Trip)
async def update_trip(
    trip_id: str,
    trip_update: TripCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a trip"""
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    existing_trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    if not existing_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing_trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this trip")
    
    update_data = trip_update.model_dump()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.trips.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": update_data}
    )
    
    updated_trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    return Trip(**{**updated_trip, "id": str(updated_trip["_id"])})


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a trip"""
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    existing_trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    if not existing_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing_trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this trip")
    
    await db.trips.delete_one({"_id": ObjectId(trip_id)})
    return None


@router.post("/{trip_id}/activities", response_model=Trip)
async def add_activity_to_trip(
    trip_id: str,
    activity: TripActivity,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Add an activity to a trip"""
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip")
    
    # Verify business exists
    if not ObjectId.is_valid(activity.business_id):
        raise HTTPException(status_code=400, detail="Invalid business ID")
    
    business = await db.businesses.find_one({"_id": ObjectId(activity.business_id)})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    await db.trips.update_one(
        {"_id": ObjectId(trip_id)},
        {
            "$push": {"activities": activity.model_dump()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    updated_trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    return Trip(**{**updated_trip, "id": str(updated_trip["_id"])})


@router.delete("/{trip_id}/activities/{business_id}", response_model=Trip)
async def remove_activity_from_trip(
    trip_id: str,
    business_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Remove an activity from a trip"""
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip")
    
    await db.trips.update_one(
        {"_id": ObjectId(trip_id)},
        {
            "$pull": {"activities": {"business_id": business_id}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    updated_trip = await db.trips.find_one({"_id": ObjectId(trip_id)})
    return Trip(**{**updated_trip, "id": str(updated_trip["_id"])})
