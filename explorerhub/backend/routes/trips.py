from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from datetime import datetime
from database import get_database
from models.trip import TripCreate, Trip, TripInDB, TripActivity, TripWithUser, TripVisibility
from models.counter import get_next_sequence_value
from auth import get_current_active_user
from models.user import UserInDB
from utils import serialize_doc, serialize_docs

router = APIRouter(prefix="/api/trips", tags=["trips"])


async def get_current_user_optional(request: Request, db = Depends(get_database)) -> Optional[UserInDB]:
    """Get current user if authenticated, None otherwise"""
    try:
        return await get_current_active_user(request, db)
    except:
        return None


async def can_user_view_trip(trip_visibility: str, trip_user_id: str, current_user: UserInDB = None, db = None) -> bool:
    """Check if current user can view a trip based on its visibility"""
    if trip_visibility == TripVisibility.public:
        return True
    
    if not current_user:
        return False
    
    current_user_id = str(current_user.id)
    
    # User can always see their own trips
    if current_user_id == trip_user_id:
        return True
    
    if trip_visibility == TripVisibility.followers:
        # Check if current user follows the trip owner
        follow = await db.followers.find_one({
            "follower_id": current_user_id,
            "following_id": trip_user_id
        })
        return follow is not None
    
    # Private trips can only be seen by the owner
    return False


@router.post("/", response_model=Trip, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip: TripCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new trip"""
    trip_dict = trip.model_dump()
    
    # Convert date strings to datetime objects for MongoDB compatibility
    if isinstance(trip_dict["start_date"], str):
        trip_dict["start_date"] = datetime.fromisoformat(trip_dict["start_date"])
    if isinstance(trip_dict["end_date"], str):
        trip_dict["end_date"] = datetime.fromisoformat(trip_dict["end_date"])
    
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


@router.get("/public", response_model=List[TripWithUser])
async def get_public_trips(
    current_user: Optional[UserInDB] = Depends(get_current_user_optional),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 20
):
    """Get trips visible to current user (public + followers' trips)"""
    current_user_id = str(current_user.id) if current_user else None
    
    # Get list of users current user follows (if authenticated)
    following_ids = []
    if current_user_id:
        cursor = db.followers.find({"follower_id": current_user_id})
        following = await cursor.to_list(length=1000)
        following_ids = [f["following_id"] for f in following]
        following_ids.append(current_user_id)  # Include own trips
    
    # Build query for trips that user can see
    if current_user_id:
        # Authenticated user can see public trips, followers-only trips from followed users, and their own private trips
        query = {
            "$or": [
                {"visibility": TripVisibility.public},  # Public trips
                {
                    "$and": [
                        {"visibility": TripVisibility.followers},  # Followers-only trips
                        {"user_id": {"$in": following_ids}}  # From users they follow or themselves
                    ]
                },
                {
                    "$and": [
                        {"visibility": TripVisibility.private},  # Private trips
                        {"user_id": current_user_id}  # Only their own
                    ]
                }
            ]
        }
    else:
        # Unauthenticated users can only see public trips
        query = {"visibility": TripVisibility.public}
    
    cursor = db.trips.find(query).sort("created_at", -1).skip(skip).limit(limit)
    trips = await cursor.to_list(length=limit)
    
    trips_with_users = []
    for trip in trips:
        trip = serialize_doc(trip)
        
        # Get user info
        user = await db.users.find_one({"id": int(trip["user_id"])})
        if user:
            trip["user_name"] = user.get("full_name", "Usuario")
            trip["user_profile_picture"] = user.get("profile_picture")
        else:
            trip["user_name"] = "Usuario"
            trip["user_profile_picture"] = None
        
        # Get comments count
        comments = await db.trip_comments.find({"trip_id": trip["id"]}).to_list(length=100)
        trip["comments"] = [serialize_doc(c) for c in comments]
        
        # Get likes count
        likes_count = await db.trip_likes.count_documents({"trip_id": trip["id"]})
        trip["likes_count"] = likes_count
        
        trips_with_users.append(TripWithUser(**trip))
    
    return trips_with_users


@router.get("/user/{user_id}/public", response_model=List[Trip])
async def get_user_public_trips(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get public trips for a specific user (visible to current user)"""
    current_user_id = str(current_user.id)
    
    # Check if current user can see this user's trips
    can_view = False
    if current_user_id == user_id:
        # User can see all their own trips
        can_view = True
    else:
        # Check if current user follows the target user
        follow = await db.followers.find_one({
            "follower_id": current_user_id,
            "following_id": user_id
        })
        can_view = follow is not None
    
    if not can_view:
        # If not following, only show public trips
        query = {
            "user_id": user_id,
            "visibility": TripVisibility.public
        }
    else:
        # If following, show public and followers-only trips
        query = {
            "user_id": user_id,
            "visibility": {"$in": [TripVisibility.public, TripVisibility.followers]}
        }
    
    cursor = db.trips.find(query).sort("created_at", -1)
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
    
    # Convert date strings to datetime objects for MongoDB compatibility
    if isinstance(update_data["start_date"], str):
        update_data["start_date"] = datetime.fromisoformat(update_data["start_date"])
    if isinstance(update_data["end_date"], str):
        update_data["end_date"] = datetime.fromisoformat(update_data["end_date"])
    
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


@router.post("/{trip_id}/comments", response_model=Trip)
async def add_comment_to_trip(
    trip_id: int,
    comment: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Add a comment to a trip"""
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip_data = serialize_doc(trip)
    trip_user_id = trip_data["user_id"]
    
    # Check if user can view this trip
    if not await can_user_view_trip(trip_data["visibility"], trip_user_id, current_user, db):
        raise HTTPException(status_code=403, detail="Cannot comment on this trip")
    
    comment_doc = {
        "trip_id": trip_id,
        "user_id": str(current_user.id),
        "user_name": current_user.full_name,
        "comment": comment,
        "created_at": datetime.utcnow()
    }
    
    await db.trip_comments.insert_one(comment_doc)
    
    updated_trip = await db.trips.find_one({"id": trip_id})
    updated_trip = serialize_doc(updated_trip)
    return Trip(**updated_trip)


@router.post("/{trip_id}/like", status_code=status.HTTP_201_CREATED)
async def like_trip(
    trip_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Like a public trip"""
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip_data = serialize_doc(trip)
    trip_user_id = trip_data["user_id"]
    
    # Check if user can view this trip
    if not await can_user_view_trip(trip_data["visibility"], trip_user_id, current_user, db):
        raise HTTPException(status_code=403, detail="Cannot like this trip")
    
    # Check if already liked
    existing_like = await db.trip_likes.find_one({
        "trip_id": trip_id,
        "user_id": str(current_user.id)
    })
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked")
    
    await db.trip_likes.insert_one({
        "trip_id": trip_id,
        "user_id": str(current_user.id),
        "created_at": datetime.utcnow()
    })
    
    return {"message": "Trip liked successfully"}


@router.delete("/{trip_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_trip(
    trip_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Unlike a public trip"""
    result = await db.trip_likes.delete_one({
        "trip_id": trip_id,
        "user_id": str(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Like not found")
    
    return None

