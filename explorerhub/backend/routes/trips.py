from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from database import get_database
from models.trip import TripCreate, Trip, TripInDB, TripActivity
from models.counter import get_next_sequence_value
from auth import get_current_active_user
from models.user import UserInDB
from utils import serialize_doc, serialize_docs

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
    
    # Get next sequential ID
    next_id = await get_next_sequence_value("trips", db)
    trip_dict["id"] = next_id
    
    await db.trips.insert_one(trip_dict)
    created_trip = await db.trips.find_one({"id": next_id})
    created_trip = serialize_doc(created_trip)
    
    return Trip(**created_trip)


@router.get("/", response_model=List[Trip])
async def get_my_trips(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all trips for current user"""
    user_id = str(current_user.id) if hasattr(current_user, 'id') else str(current_user._id)
    cursor = db.trips.find({"user_id": user_id}).sort("start_date", -1)
    trips = await cursor.to_list(length=100)
    trips = serialize_docs(trips)
    
    return [Trip(**t) for t in trips]


@router.get("/{trip_id}", response_model=Trip)
async def get_trip(
    trip_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get a specific trip"""
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    user_id = str(current_user.id) if hasattr(current_user, 'id') else str(current_user._id)
    if trip["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this trip")
    
    trip = serialize_doc(trip)
    return Trip(**trip)


@router.put("/{trip_id}", response_model=Trip)
async def update_trip(
    trip_id: int,
    trip_update: TripCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a trip"""
    existing_trip = await db.trips.find_one({"id": trip_id})
    if not existing_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing_trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this trip")
    
    update_data = trip_update.model_dump()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.trips.update_one(
        {"id": trip_id},
        {"$set": update_data}
    )
    
    updated_trip = await db.trips.find_one({"id": trip_id})
    updated_trip = serialize_doc(updated_trip)
    return Trip(**updated_trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a trip"""
    existing_trip = await db.trips.find_one({"id": trip_id})
    if not existing_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing_trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this trip")
    
    await db.trips.delete_one({"id": trip_id})
    return None


@router.post("/{trip_id}/activities", response_model=Trip)
async def add_activity_to_trip(
    trip_id: int,
    activity: TripActivity,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Add an activity to a trip"""
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip")
    
    # Verify business exists
    business = await db.businesses.find_one({"id": activity.business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    await db.trips.update_one(
        {"id": trip_id},
        {
            "$push": {"activities": activity.model_dump()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    updated_trip = await db.trips.find_one({"id": trip_id})
    updated_trip = serialize_doc(updated_trip)
    return Trip(**updated_trip)


@router.delete("/{trip_id}/activities/{business_id}", response_model=Trip)
async def remove_activity_from_trip(
    trip_id: int,
    business_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Remove an activity from a trip"""
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip")
    
    await db.trips.update_one(
        {"id": trip_id},
        {
            "$pull": {"activities": {"business_id": business_id}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    updated_trip = await db.trips.find_one({"id": trip_id})
    updated_trip = serialize_doc(updated_trip)
    return Trip(**updated_trip)
