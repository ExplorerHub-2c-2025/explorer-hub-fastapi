from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
from database import get_database
from models.promotion import PromotionCreate, Promotion, PromotionUpdate, PromotionClaim
from models.counter import get_next_sequence_value
from auth import get_current_active_user
from models.user import UserInDB
from utils import serialize_doc, serialize_docs
from routes.notifications import notify_new_promotion
from flash_sale_checker import check_promotion_after_use

router = APIRouter(prefix="/api/promotions", tags=["promotions"])


@router.post("/", response_model=Promotion, status_code=status.HTTP_201_CREATED)
async def create_promotion(
    promotion: PromotionCreate,
    business_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new promotion for a business (only business owner)"""
    # Verify business exists and user is owner
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if business["owner_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only business owner can create promotions"
        )
    
    # Validate dates
    if promotion.start_date > promotion.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )
    
    # Validate that end date is not in the past
    today = date.today()
    if promotion.end_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be in the past"
        )
    
    # Validate discount (must have either percentage or amount, not both)
    if promotion.discount_percentage and promotion.discount_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion can have either discount_percentage or discount_amount, not both"
        )
    
    if not promotion.discount_percentage and not promotion.discount_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion must have either discount_percentage or discount_amount"
        )
    
    # Validate promotion type
    if promotion.promotion_type not in ["code", "automatic"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion type must be either 'code' or 'automatic'"
        )
    
    # If promotion type is "code", a code must be provided
    if promotion.promotion_type == "code" and not promotion.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code-based promotions must have a promotional code"
        )
    
    promotion_dict = promotion.model_dump()
    promotion_dict["business_id"] = business_id
    
    # Get next sequential ID
    next_id = await get_next_sequence_value("promotions", db)
    promotion_dict["id"] = next_id
    
    # Add default fields
    promotion_dict["current_uses"] = 0
    promotion_dict["is_active"] = True
    promotion_dict["created_at"] = datetime.utcnow()
    promotion_dict["updated_at"] = datetime.utcnow()
    
    # Convert dates to ISO strings for MongoDB
    if isinstance(promotion_dict.get("start_date"), date):
        promotion_dict["start_date"] = promotion_dict["start_date"].isoformat()
    if isinstance(promotion_dict.get("end_date"), date):
        promotion_dict["end_date"] = promotion_dict["end_date"].isoformat()
    
    await db.promotions.insert_one(promotion_dict)
    created_promotion = await db.promotions.find_one({"id": next_id})
    created_promotion = serialize_doc(created_promotion)
    
    # TODO: Notify interested users about new promotion
    # This could be based on users who have favorited/bookmarked the business
    # For now, we'll skip this as we need a favorites/interests system
    # Example:
    # interested_users = await db.favorites.find({"business_id": business_id}).to_list(100)
    # await notify_new_promotion(
    #     business_id=business_id,
    #     business_name=business["name"],
    #     promotion_code=promotion.code,
    #     discount=promotion.discount_percentage or promotion.discount_amount,
    #     interested_user_ids=[u["user_id"] for u in interested_users],
    #     db=db
    # )
    
    return Promotion(**created_promotion)


@router.get("/", response_model=List[Promotion])
async def get_promotions(
    business_id: Optional[int] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 50,
    db = Depends(get_database)
):
    """Get promotions with optional filtering"""
    query = {}
    
    if business_id:
        query["business_id"] = business_id
    
    if active_only:
        query["is_active"] = True
        # Also check if promotion is still valid (not expired)
        today = date.today().isoformat()
        query["end_date"] = {"$gte": today}
    
    cursor = db.promotions.find(query).skip(skip).limit(limit).sort("created_at", -1)
    promotions = await cursor.to_list(length=limit)
    promotions = serialize_docs(promotions)
    
    return [Promotion(**p) for p in promotions]


@router.get("/flash-sales", response_model=List[dict])
async def get_flash_sales(
    db = Depends(get_database)
):
    """Get all promotions marked as flash sales (is_flash_sale=True)"""
    now = datetime.now()
    today = date.today()
    
    # Find all flash sale promotions that are:
    # 1. Active
    # 2. is_flash_sale = True
    # 3. Within the valid date range
    
    cursor = db.promotions.find({
        "is_flash_sale": True,
        "is_active": True
    })
    
    promotions = await cursor.to_list(length=100)
    flash_sales = []
    
    for promo in promotions:
        try:
            # Parse dates
            start_date_str = promo.get("start_date")
            end_date_str = promo.get("end_date")
            
            if isinstance(start_date_str, str):
                start_date = date.fromisoformat(start_date_str)
            else:
                start_date = start_date_str
                
            if isinstance(end_date_str, str):
                end_date = date.fromisoformat(end_date_str)
            else:
                end_date = end_date_str
            
            # Check if within date range
            if today < start_date or today > end_date:
                continue
            
            # Calculate flash sale end time
            flash_duration_hours = promo.get("flash_duration_hours", 24)
            
            # Get the creation time of the promotion (when flash started)
            created_at_str = promo.get("created_at")
            
            if created_at_str:
                # If we have created_at, use it as flash start time
                if isinstance(created_at_str, str):
                    try:
                        # Try parsing as datetime first
                        flash_start = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    except:
                        # If it's just a date, use start of that day
                        flash_start = datetime.combine(date.fromisoformat(created_at_str), datetime.min.time())
                else:
                    flash_start = created_at_str
            else:
                # Fallback to start_date at beginning of day
                flash_start = datetime.combine(start_date, datetime.min.time())
            
            flash_end = flash_start + timedelta(hours=flash_duration_hours)
            
            # Check if flash sale is still active (not expired)
            if now > flash_end:
                continue
            
            # Get business information
            business_id = promo.get("business_id")
            business = await db.businesses.find_one({"id": business_id})
            
            if not business:
                continue
            
            # Prepare flash sale data
            flash_sale = {
                "id": promo.get("id"),
                "business_id": business_id,
                "business_name": business.get("name", ""),
                "business_image": business.get("images", [None])[0] if business.get("images") else None,
                "business_rating": business.get("rating", 0),
                "business_location": business.get("location", {}).get("city", ""),
                "title": promo.get("title", ""),
                "discount_percentage": promo.get("discount_percentage"),
                "discount_amount": promo.get("discount_amount"),
                "start_date": flash_start.isoformat(),  # Send the actual flash start time
                "flash_duration_hours": flash_duration_hours,
                "current_uses": promo.get("current_uses", 0),
                "max_uses": promo.get("max_uses"),
                "min_purchase": promo.get("min_purchase")
            }
            
            flash_sales.append(flash_sale)
            
        except (ValueError, AttributeError, TypeError) as e:
            # Skip promotions with errors
            print(f"Error processing flash sale: {e}")
            continue
    
    # Sort by remaining stock (urgency)
    flash_sales.sort(key=lambda x: (
        (x["max_uses"] - x["current_uses"]) if x.get("max_uses") else 9999
    ))
    
    return flash_sales


@router.get("/{promotion_id}", response_model=Promotion)
async def get_promotion(promotion_id: int, db = Depends(get_database)):
    """Get a specific promotion by ID"""
    promotion = await db.promotions.find_one({"id": promotion_id})
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    promotion = serialize_doc(promotion)
    return Promotion(**promotion)


@router.put("/{promotion_id}", response_model=Promotion)
async def update_promotion(
    promotion_id: int,
    promotion_update: PromotionUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a promotion (only by business owner)"""
    existing_promotion = await db.promotions.find_one({"id": promotion_id})
    if not existing_promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    # Verify user is business owner
    business = await db.businesses.find_one({"id": existing_promotion["business_id"]})
    if not business or business["owner_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this promotion"
        )
    
    update_data = promotion_update.model_dump(exclude_unset=True)
    
    # Validate dates if provided
    if "start_date" in update_data or "end_date" in update_data:
        start = update_data.get("start_date") or existing_promotion.get("start_date")
        end = update_data.get("end_date") or existing_promotion.get("end_date")
        
        if isinstance(start, str):
            start = date.fromisoformat(start)
        if isinstance(end, str):
            end = date.fromisoformat(end)
            
        if start > end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before end date"
            )
    
    # Convert dates to ISO strings for MongoDB
    if "start_date" in update_data and isinstance(update_data["start_date"], date):
        update_data["start_date"] = update_data["start_date"].isoformat()
    if "end_date" in update_data and isinstance(update_data["end_date"], date):
        update_data["end_date"] = update_data["end_date"].isoformat()
    
    update_data["updated_at"] = datetime.utcnow()
    
    await db.promotions.update_one(
        {"id": promotion_id},
        {"$set": update_data}
    )
    
    updated_promotion = await db.promotions.find_one({"id": promotion_id})
    updated_promotion = serialize_doc(updated_promotion)
    
    return Promotion(**updated_promotion)


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promotion(
    promotion_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a promotion (soft delete - only by business owner)"""
    existing_promotion = await db.promotions.find_one({"id": promotion_id})
    if not existing_promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    # Verify user is business owner
    business = await db.businesses.find_one({"id": existing_promotion["business_id"]})
    if not business or business["owner_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this promotion"
        )
    
    await db.promotions.update_one(
        {"id": promotion_id},
        {"$set": {"is_active": False}}
    )
    
    return None


@router.post("/{promotion_id}/claim", status_code=status.HTTP_201_CREATED)
async def claim_promotion(
    promotion_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Claim a promotion for later use"""
    # Business owners cannot claim promotions
    if current_user.role == "business":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business owners cannot claim promotions"
        )
    
    promotion = await db.promotions.find_one({"id": promotion_id})
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    if not promotion.get("is_active", False):
        raise HTTPException(status_code=400, detail="Promotion is not active")
    
    # Check if promotion is still valid
    today = date.today().isoformat()
    if promotion.get("end_date") < today:
        raise HTTPException(status_code=400, detail="Promotion has expired")
    
    # Check if max uses reached
    max_uses = promotion.get("max_uses")
    if max_uses and promotion.get("current_uses", 0) >= max_uses:
        raise HTTPException(status_code=400, detail="Promotion has reached maximum uses")
    
    # Check if user already claimed this promotion
    existing_claim = await db.promotion_claims.find_one({
        "user_id": current_user.id,
        "promotion_id": promotion_id
    })
    
    if existing_claim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes este código"
        )
    
    # Create claim
    claim_dict = {
        "user_id": current_user.id,
        "promotion_id": promotion_id,
        "business_id": promotion["business_id"],
        "claimed_at": datetime.utcnow(),
        "used": False,
        "used_at": None
    }
    
    # Get next sequential ID
    next_id = await get_next_sequence_value("promotion_claims", db)
    claim_dict["id"] = next_id
    
    await db.promotion_claims.insert_one(claim_dict)
    
    # Increment current_uses
    await db.promotions.update_one(
        {"id": promotion_id},
        {"$inc": {"current_uses": 1}}
    )
    
    # Verificar si debe convertirse en flash sale por stock bajo
    await check_promotion_after_use(db, promotion_id)
    
    return {"message": "Promotion claimed successfully", "claim_id": next_id}


@router.get("/user/my-claims")
async def get_my_claims(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all promotions claimed by current user"""
    cursor = db.promotion_claims.find({"user_id": current_user.id})
    claims = await cursor.to_list(length=100)
    claims = serialize_docs(claims)
    
    # Fetch promotion details for each claim
    for claim in claims:
        promotion = await db.promotions.find_one({"id": claim["promotion_id"]})
        if promotion:
            claim["promotion"] = serialize_doc(promotion)
    
    return claims


@router.get("/automatic/{business_id}")
async def get_automatic_promotions(
    business_id: int,
    db = Depends(get_database)
):
    """Get active automatic promotions for a business (public endpoint)"""
    from datetime import date as date_type
    
    today = date_type.today().isoformat()
    
    cursor = db.promotions.find({
        "business_id": business_id,
        "is_active": True,
        "promotion_type": "automatic",
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    }).sort("created_at", -1)
    
    promotions = await cursor.to_list(length=10)
    promotions = serialize_docs(promotions)
    
    # Filter out promotions that have reached max uses
    active_promotions = []
    for p in promotions:
        max_uses = p.get("max_uses")
        if max_uses is None or p.get("current_uses", 0) < max_uses:
            active_promotions.append(Promotion(**p))
    
    return active_promotions


@router.get("/available/{business_id}")
async def get_available_promotions_for_business(
    business_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all unused promotion codes that the user has claimed for a specific business"""
    # Find all claims for this user and business that haven't been used
    cursor = db.promotion_claims.find({
        "user_id": current_user.id,
        "business_id": business_id,
        "used": False
    })
    claims = await cursor.to_list(length=100)
    claims = serialize_docs(claims)
    
    # Fetch full promotion details for each claim
    available_promotions = []
    today = date.today()
    
    for claim in claims:
        promotion = await db.promotions.find_one({"id": claim["promotion_id"]})
        if promotion and promotion.get("is_active"):
            # Check if promotion is still valid (not expired)
            start_date_str = promotion.get("start_date")
            end_date_str = promotion.get("end_date")
            
            # Parse dates for comparison
            try:
                if start_date_str:
                    start_date = date.fromisoformat(start_date_str) if isinstance(start_date_str, str) else start_date_str
                else:
                    start_date = None
                    
                if end_date_str:
                    end_date = date.fromisoformat(end_date_str) if isinstance(end_date_str, str) else end_date_str
                else:
                    end_date = None
                
                # Check if promotion is currently valid
                is_valid = True
                if start_date and today < start_date:
                    is_valid = False
                if end_date and today > end_date:
                    is_valid = False
                
                if is_valid:
                    promotion_data = serialize_doc(promotion)
                    promotion_data["claim_id"] = claim["id"]
                    available_promotions.append(promotion_data)
            except (ValueError, AttributeError):
                # Skip promotions with invalid dates
                continue
    
    return available_promotions
