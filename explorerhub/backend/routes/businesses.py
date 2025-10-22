from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from database import get_database
from models.business import BusinessCreate, Business, BusinessInDB
from models.counter import get_next_sequence_value
from auth import get_current_active_user
from models.user import UserInDB
from utils import serialize_doc, serialize_docs

router = APIRouter(prefix="/api/businesses", tags=["businesses"])


@router.post("/", response_model=Business, status_code=status.HTTP_201_CREATED)
async def create_business(
    business: BusinessCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new business (requires authentication)"""
    if current_user.role != "business":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only business accounts can create businesses"
        )
    
    business_dict = business.model_dump()
    # Get user id from current_user
    user_id = current_user.id if current_user.id is not None else None
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User ID not found"
        )
    business_dict["owner_id"] = str(user_id)
    
    # Get next sequential ID
    next_id = await get_next_sequence_value("businesses", db)
    business_dict["id"] = next_id
    
    # Add default fields
    business_dict["rating"] = 0.0
    business_dict["review_count"] = 0
    business_dict["views"] = 0
    business_dict["created_at"] = datetime.utcnow()
    business_dict["updated_at"] = datetime.utcnow()
    business_dict["is_active"] = True
    
    await db.businesses.insert_one(business_dict)
    created_business = await db.businesses.find_one({"id": next_id})
    created_business = serialize_doc(created_business)
    
    return Business(**created_business)


@router.get("/", response_model=List[Business])
async def get_businesses(
    category: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_price: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db = Depends(get_database)
):
    """Get businesses with optional filtering"""
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    
    if city:
        query["location.city"] = {"$regex": city, "$options": "i"}
    
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    
    if max_price:
        query["price_level"] = {"$lte": max_price}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.businesses.find(query).skip(skip).limit(limit).sort("rating", -1)
    businesses = await cursor.to_list(length=limit)
    businesses = serialize_docs(businesses)
    
    # Ensure all required fields have default values
    for business in businesses:
        business.setdefault("rating", 0.0)
        business.setdefault("views", 0)
        business.setdefault("review_count", 0)
        business.setdefault("created_at", datetime.utcnow())
        business.setdefault("is_active", True)
    
    return [Business(**b) for b in businesses]


@router.get("/{business_id}", response_model=Business)
async def get_business(business_id: int, db = Depends(get_database)):
    """Get a specific business by ID"""
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    business = serialize_doc(business)
    
    # Ensure all required fields have default values
    business.setdefault("rating", 0.0)
    business.setdefault("views", 0)
    business.setdefault("review_count", 0)
    business.setdefault("created_at", datetime.utcnow())
    business.setdefault("is_active", True)
    
    return Business(**business)


@router.put("/{business_id}", response_model=Business)
async def update_business(
    business_id: int,
    business_update: BusinessCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a business (only by owner)"""
    existing_business = await db.businesses.find_one({"id": business_id})
    if not existing_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if existing_business["owner_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this business")
    
    update_data = business_update.model_dump()
    await db.businesses.update_one(
        {"id": business_id},
        {"$set": update_data}
    )
    
    updated_business = await db.businesses.find_one({"id": business_id})
    updated_business = serialize_doc(updated_business)
    
    # Ensure all required fields have default values
    updated_business.setdefault("rating", 0.0)
    updated_business.setdefault("views", 0)
    updated_business.setdefault("review_count", 0)
    updated_business.setdefault("created_at", datetime.utcnow())
    updated_business.setdefault("is_active", True)
    
    return Business(**updated_business)


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(
    business_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a business (soft delete - only by owner)"""
    existing_business = await db.businesses.find_one({"id": business_id})
    if not existing_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if existing_business["owner_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this business")
    
    await db.businesses.update_one(
        {"id": business_id},
        {"$set": {"is_active": False}}
    )
    
    return None


@router.get("/owner/my-businesses", response_model=List[Business])
async def get_my_businesses(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all businesses owned by current user"""
    user_id = current_user.id if current_user.id is not None else None
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User ID not found"
        )
    cursor = db.businesses.find({"owner_id": str(user_id)})
    businesses = await cursor.to_list(length=100)
    businesses = serialize_docs(businesses)
    
    # Ensure all required fields have default values
    for business in businesses:
        business.setdefault("rating", 0.0)
        business.setdefault("views", 0)
        business.setdefault("review_count", 0)
        business.setdefault("created_at", datetime.utcnow())
        business.setdefault("is_active", True)
    
    return [Business(**b) for b in businesses]


@router.post("/{business_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def increment_business_view(business_id: int, db = Depends(get_database)):
    """Increment the view count for a business (public endpoint)"""
    await db.businesses.update_one({"id": business_id}, {"$inc": {"views": 1}})
    return None


@router.get("/owner/analytics")
async def owner_analytics(current_user: UserInDB = Depends(get_current_active_user), db = Depends(get_database)):
    """Return simple analytics for an owner's businesses: total, avg rating, total reviews, total views."""
    user_id = current_user.id if current_user.id is not None else None
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User ID not found"
        )
    cursor = db.businesses.find({"owner_id": str(user_id)})
    businesses = await cursor.to_list(length=1000)

    total = len(businesses)
    total_reviews = sum(b.get("review_count", 0) for b in businesses)
    total_views = sum(b.get("views", 0) for b in businesses)
    avg_rating = 0.0
    if total > 0:
        avg_rating = sum(b.get("rating", 0.0) for b in businesses) / total

    return {
        "total_businesses": total,
        "average_rating": round(avg_rating, 2),
        "total_reviews": total_reviews,
        "total_views": total_views,
    }
