from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from database import get_database
from models.review import ReviewCreate, Review, ReviewInDB
from models.counter import get_next_sequence_value
from auth import get_current_active_user
from models.user import UserInDB
from utils import serialize_doc, serialize_docs

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("/", response_model=Review, status_code=status.HTTP_201_CREATED)
async def create_review(
    review: ReviewCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new review"""
    # Verify business exists
    business = await db.businesses.find_one({"id": review.business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check if user already reviewed this business
    existing_review = await db.reviews.find_one({
        "business_id": review.business_id,
        "user_id": str(current_user.id)
    })
    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this business"
        )
    
    # Create review
    review_dict = review.model_dump()
    review_dict["user_id"] = str(current_user.id)
    review_dict["user_name"] = current_user.full_name
    review_dict["helpful_count"] = 0
    review_dict["created_at"] = datetime.utcnow()
    review_dict["updated_at"] = datetime.utcnow()
    
    # Get next sequential ID
    next_id = await get_next_sequence_value("reviews", db)
    review_dict["id"] = next_id
    
    await db.reviews.insert_one(review_dict)
    
    # Update business rating
    await update_business_rating(review.business_id, db)
    
    created_review = await db.reviews.find_one({"id": next_id})
    created_review = serialize_doc(created_review)
    return Review(**created_review)


@router.get("/business/{business_id}", response_model=List[Review])
async def get_business_reviews(
    business_id: int,
    skip: int = 0,
    limit: int = 20,
    db = Depends(get_database)
):
    """Get all reviews for a business"""
    cursor = db.reviews.find({"business_id": business_id}).sort("created_at", -1).skip(skip).limit(limit)
    reviews = await cursor.to_list(length=limit)
    reviews = serialize_docs(reviews)
    
    return [Review(**r) for r in reviews]


@router.get("/user/my-reviews", response_model=List[Review])
async def get_my_reviews(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all reviews by current user"""
    user_id = str(current_user.id) if hasattr(current_user, 'id') else str(current_user._id)
    cursor = db.reviews.find({"user_id": user_id}).sort("created_at", -1)
    reviews = await cursor.to_list(length=100)
    reviews = serialize_docs(reviews)
    
    return [Review(**r) for r in reviews]


@router.put("/{review_id}", response_model=Review)
async def update_review(
    review_id: int,
    review_update: ReviewCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a review (only by author)"""
    existing_review = await db.reviews.find_one({"id": review_id})
    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if existing_review["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    update_data = review_update.model_dump()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": update_data}
    )
    
    # Update business rating
    await update_business_rating(existing_review["business_id"], db)
    
    updated_review = await db.reviews.find_one({"id": review_id})
    updated_review = serialize_doc(updated_review)
    return Review(**updated_review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a review (only by author)"""
    existing_review = await db.reviews.find_one({"id": review_id})
    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if existing_review["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    business_id = existing_review["business_id"]
    await db.reviews.delete_one({"id": review_id})
    
    # Update business rating
    await update_business_rating(business_id, db)
    
    return None


@router.post("/{review_id}/helpful", status_code=status.HTTP_200_OK)
async def mark_review_helpful(
    review_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Mark a review as helpful"""
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review marked as helpful"}


async def update_business_rating(business_id: int, db):
    """Helper function to recalculate business rating"""
    pipeline = [
        {"$match": {"business_id": business_id}},
        {"$group": {
            "_id": "$business_id",
            "avg_rating": {"$avg": "$rating"},
            "count": {"$sum": 1}
        }}
    ]
    
    result = await db.reviews.aggregate(pipeline).to_list(length=1)
    
    if result:
        await db.businesses.update_one(
            {"id": business_id},
            {"$set": {
                "rating": round(result[0]["avg_rating"], 1),
                "review_count": result[0]["count"]
            }}
        )
    else:
        await db.businesses.update_one(
            {"id": business_id},
            {"$set": {"rating": 0.0, "review_count": 0}}
        )
