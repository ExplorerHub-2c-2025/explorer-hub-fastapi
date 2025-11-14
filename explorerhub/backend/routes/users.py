from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict
from datetime import datetime
from database import get_database
from models.follower import FollowerCreate, UserProfile, UserSearchResult
from auth import get_current_active_user, get_optional_current_user
from models.user import UserInDB
from utils import serialize_doc, serialize_docs
from routes.notifications import notify_new_follower
from models.trip import TripWithUser

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/search", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    """Search users by username or full name"""
    # Search by username or full name (case-insensitive)
    # Only search for travelers (role: client), not business users
    query = {
        "$and": [
            {
                "$or": [
                    {"username": {"$regex": q, "$options": "i"}},
                    {"full_name": {"$regex": q, "$options": "i"}}
                ]
            },
            {"role": "client"}  # Only search travelers, not businesses
        ]
    }
    
    cursor = db.users.find(query).limit(20)
    users = await cursor.to_list(length=20)
    
    current_user_id = str(current_user.id) if current_user else None
    
    results = []
    for user in users:
        user = serialize_doc(user)
        
        # Get user ID (could be 'id' or '_id')
        user_id = str(user.get("id") or user.get("_id", ""))
        
        # Don't include current user in results
        if current_user_id and user_id == current_user_id:
            continue
        
        # Count trips
        trips_count = await db.trips.count_documents({
            "user_id": user_id,
            "is_public": True
        })
        
        # Check if current user follows this user
        is_following = False
        if current_user_id:
            follow = await db.followers.find_one({
                "follower_id": current_user_id,
                "following_id": user_id
            })
            is_following = follow is not None
        
        results.append(UserSearchResult(
            id=user_id,
            username=user.get("username", ""),
            full_name=user.get("full_name", "Usuario"),
            profile_picture=user.get("profile_picture"),
            trips_count=trips_count,
            is_following=is_following
        ))
    
    return results


@router.get("/{user_id}", response_model=Dict)
async def get_user_by_id(
    user_id: str,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    """Get user by ID"""
    user = await db.users.find_one({"id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = serialize_doc(user)
    
    # Check if current user follows this user
    is_following = False
    if current_user:
        current_user_id = str(current_user.id)
        follow = await db.followers.find_one({
            "follower_id": current_user_id,
            "following_id": user_id
        })
        is_following = follow is not None
    
    return {
        "id": user["id"],
        "username": user.get("username", ""),
        "full_name": user.get("full_name", "Usuario"),
        "profile_picture": user.get("profile_picture"),
        "bio": user.get("bio"),
        "country": user.get("country"),
        "travel_preferences": user.get("travel_preferences", []),
        "is_following": is_following
    }


@router.get("/{user_id}/stats", response_model=Dict)
async def get_user_stats(
    user_id: str,
    db = Depends(get_database)
):
    """Get user stats (trips, followers, following counts)"""
    user = await db.users.find_one({"id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count followers
    followers_count = await db.followers.count_documents({"following_id": user_id})
    
    # Count following
    following_count = await db.followers.count_documents({"follower_id": user_id})
    
    # Count public trips
    from models.trip import TripVisibility
    trips_count = await db.trips.count_documents({
        "user_id": user_id,
        "visibility": {"$in": [TripVisibility.public, TripVisibility.followers]}
    })
    
    return {
        "trips_count": trips_count,
        "followers_count": followers_count,
        "following_count": following_count
    }


@router.get("/{user_id}/trips", response_model=List)
async def get_user_trips(
    user_id: str,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 20
):
    """Get public trips from a specific user"""
    from models.trip import TripVisibility
    
    # Determine which trips the current user can see
    current_user_id = str(current_user.id) if current_user else None
    
    # Check if current user follows this user
    is_following = False
    if current_user_id:
        follow = await db.followers.find_one({
            "follower_id": current_user_id,
            "following_id": user_id
        })
        is_following = follow is not None
    
    # Build query based on relationship
    if current_user_id == user_id:
        # Own trips - see all
        query = {"user_id": user_id}
    elif is_following:
        # Following - see public and followers-only
        query = {
            "user_id": user_id,
            "visibility": {"$in": [TripVisibility.public, TripVisibility.followers]}
        }
    else:
        # Not following - see only public
        query = {
            "user_id": user_id,
            "visibility": TripVisibility.public
        }
    
    cursor = db.trips.find(query).sort("created_at", -1).skip(skip).limit(limit)
    trips = await cursor.to_list(length=limit)
    
    trips_with_data = []
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
        
        # Get comments
        comments = await db.trip_comments.find({"trip_id": trip["id"]}).to_list(length=100)
        trip["comments"] = [serialize_doc(c) for c in comments]
        
        # Get likes count
        likes_count = await db.trip_likes.count_documents({"trip_id": trip["id"]})
        trip["likes_count"] = likes_count
        
        trips_with_data.append(TripWithUser(**trip))
    
    return trips_with_data


@router.get("/{user_id}/followers", response_model=List[Dict])
async def get_user_followers(
    user_id: str,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    """Get list of users that follow this user"""
    # Get all followers
    cursor = db.followers.find({"following_id": user_id})
    followers_data = await cursor.to_list(length=1000)
    
    current_user_id = str(current_user.id) if current_user else None
    
    result = []
    for follow in followers_data:
        follower_id = follow["follower_id"]
        
        # Get follower user data
        user = await db.users.find_one({"id": int(follower_id)})
        if not user:
            continue
            
        user = serialize_doc(user)
        
        # Check if current user follows this follower
        is_following = False
        if current_user_id and current_user_id != follower_id:
            follow_check = await db.followers.find_one({
                "follower_id": current_user_id,
                "following_id": follower_id
            })
            is_following = follow_check is not None
        
        result.append({
            "id": user["id"],
            "username": user.get("username", ""),
            "full_name": user.get("full_name", "Usuario"),
            "profile_picture": user.get("profile_picture"),
            "is_following": is_following
        })
    
    return result


@router.get("/{user_id}/following", response_model=List[Dict])
async def get_user_following(
    user_id: str,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    """Get list of users that this user follows"""
    # Get all following
    cursor = db.followers.find({"follower_id": user_id})
    following_data = await cursor.to_list(length=1000)
    
    current_user_id = str(current_user.id) if current_user else None
    
    result = []
    for follow in following_data:
        following_id = follow["following_id"]
        
        # Get following user data
        user = await db.users.find_one({"id": int(following_id)})
        if not user:
            continue
            
        user = serialize_doc(user)
        
        # Check if current user follows this user
        is_following = False
        if current_user_id and current_user_id != following_id:
            follow_check = await db.followers.find_one({
                "follower_id": current_user_id,
                "following_id": following_id
            })
            is_following = follow_check is not None
        
        result.append({
            "id": user["id"],
            "username": user.get("username", ""),
            "full_name": user.get("full_name", "Usuario"),
            "profile_picture": user.get("profile_picture"),
            "is_following": is_following
        })
    
    return result


@router.get("/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(
    user_id: str,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    """Get user profile with stats"""
    user = await db.users.find_one({"id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = serialize_doc(user)
    
    # Count followers
    followers_count = await db.followers.count_documents({"following_id": user_id})
    
    # Count following
    following_count = await db.followers.count_documents({"follower_id": user_id})
    
    # Count public trips
    trips_count = await db.trips.count_documents({
        "user_id": user_id,
        "is_public": True
    })
    
    # Check if current user follows this user
    is_following = False
    if current_user:
        current_user_id = str(current_user.id)
        follow = await db.followers.find_one({
            "follower_id": current_user_id,
            "following_id": user_id
        })
        is_following = follow is not None
    
    return UserProfile(
        id=user["id"],
        username=user.get("username", ""),
        full_name=user.get("full_name", "Usuario"),
        profile_picture=user.get("profile_picture"),
        followers_count=followers_count,
        following_count=following_count,
        trips_count=trips_count,
        is_following=is_following
    )


@router.post("/{user_id}/follow", status_code=status.HTTP_201_CREATED)
async def follow_user(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Follow a user"""
    current_user_id = str(current_user.id)
    
    # Can't follow yourself
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if user exists
    target_user = await db.users.find_one({"id": int(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing = await db.followers.find_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Create follow relationship
    follow_doc = {
        "follower_id": current_user_id,
        "following_id": user_id,
        "created_at": datetime.utcnow()
    }
    
    await db.followers.insert_one(follow_doc)
    
    # Create notification for the followed user
    followed_user = await db.users.find_one({"id": int(user_id)})
    if followed_user:
        followed_user_data = serialize_doc(followed_user)
        follower_user = await db.users.find_one({"id": current_user.id})
        if follower_user:
            follower_data = serialize_doc(follower_user)
            await notify_new_follower(
                follower_id=current_user.id,
                follower_name=follower_data.get("full_name", "Usuario"),
                followed_user_id=int(user_id),
                db=db
            )
    
    return {"message": "User followed successfully"}


@router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Unfollow a user"""
    current_user_id = str(current_user.id)
    
    # Delete follow relationship
    result = await db.followers.delete_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    return None


@router.get("/following/feed", response_model=List[TripWithUser])
async def get_following_feed(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 20
):
    """Get trips from users that current user follows"""
    current_user_id = str(current_user.id)
    
    # Get list of users current user follows
    cursor = db.followers.find({"follower_id": current_user_id})
    following = await cursor.to_list(length=1000)
    following_ids = [f["following_id"] for f in following]
    
    if not following_ids:
        return []
    
    # Get trips from followed users that are public or followers-only
    from models.trip import TripVisibility
    
    cursor = db.trips.find({
        "user_id": {"$in": following_ids},
        "visibility": {"$in": [TripVisibility.public, TripVisibility.followers]}
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    trips = await cursor.to_list(length=limit)
    
    trips_with_users = []
    for trip in trips:
        trip = serialize_doc(trip)
        
        # Get user info
        user = await db.users.find_one({"id": int(trip["user_id"])})
        if user:
            trip["user_name"] = user.get("full_name", "Usuario")
            trip["user_profile_picture"] = user.get("profile_picture")
            print(f"DEBUG: User {trip['user_id']} profile_picture: {trip['user_profile_picture']}")
        else:
            trip["user_name"] = "Usuario"
            trip["user_profile_picture"] = None
        
        # Get comments
        comments = await db.trip_comments.find({"trip_id": trip["id"]}).to_list(length=100)
        trip["comments"] = [serialize_doc(c) for c in comments]
        
        # Get likes count
        likes_count = await db.trip_likes.count_documents({"trip_id": trip["id"]})
        trip["likes_count"] = likes_count
        
        trips_with_users.append(TripWithUser(**trip))
    
    return trips_with_users
