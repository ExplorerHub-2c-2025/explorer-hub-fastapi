from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from bson import ObjectId
from database import get_database
from models.business import BusinessCreate, Business, BusinessInDB
from auth import get_current_active_user
from models.user import UserInDB

router = APIRouter(prefix="/api/businesses", tags=["businesses"])


@router.post("/", response_model=Business, status_code=status.HTTP_201_CREATED)
async def create_business(
    business: BusinessCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new business (requires authentication)"""
    if not current_user.is_business:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only business accounts can create businesses"
        )
    
    business_dict = business.model_dump()
    business_dict["owner_id"] = str(current_user.id)
    
    result = await db.businesses.insert_one(business_dict)
    created_business = await db.businesses.find_one({"_id": result.inserted_id})
    
    return Business(**{**created_business, "id": str(created_business["_id"])})


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
    
    return [Business(**{**b, "id": str(b["_id"])}) for b in businesses]


@router.get("/{business_id}", response_model=Business)
async def get_business(business_id: str, db = Depends(get_database)):
    """Get a specific business by ID"""
    if not ObjectId.is_valid(business_id):
        raise HTTPException(status_code=400, detail="Invalid business ID")
    
    business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    return Business(**{**business, "id": str(business["_id"])})


@router.put("/{business_id}", response_model=Business)
async def update_business(
    business_id: str,
    business_update: BusinessCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a business (only by owner)"""
    if not ObjectId.is_valid(business_id):
        raise HTTPException(status_code=400, detail="Invalid business ID")
    
    existing_business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    if not existing_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if existing_business["owner_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this business")
    
    update_data = business_update.model_dump()
    await db.businesses.update_one(
        {"_id": ObjectId(business_id)},
        {"$set": update_data}
    )
    
    updated_business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    return Business(**{**updated_business, "id": str(updated_business["_id"])})


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(
    business_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a business (soft delete - only by owner)"""
    if not ObjectId.is_valid(business_id):
        raise HTTPException(status_code=400, detail="Invalid business ID")
    
    existing_business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    if not existing_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if existing_business["owner_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this business")
    
    await db.businesses.update_one(
        {"_id": ObjectId(business_id)},
        {"$set": {"is_active": False}}
    )
    
    return None


@router.get("/owner/my-businesses", response_model=List[Business])
async def get_my_businesses(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all businesses owned by current user"""
    cursor = db.businesses.find({"owner_id": str(current_user.id)})
    businesses = await cursor.to_list(length=100)
    
    return [Business(**{**b, "id": str(b["_id"])}) for b in businesses]


@router.post("/{business_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def increment_business_view(business_id: str, db = Depends(get_database)):
    """Increment the view count for a business (public endpoint)"""
    if not ObjectId.is_valid(business_id):
        raise HTTPException(status_code=400, detail="Invalid business ID")

    await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$inc": {"views": 1}})
    return None


@router.get("/owner/analytics")
async def owner_analytics(current_user: UserInDB = Depends(get_current_active_user), db = Depends(get_database)):
    """Return simple analytics for an owner's businesses: total, avg rating, total reviews, total views."""
    cursor = db.businesses.find({"owner_id": str(current_user.id)})
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
