from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from database import get_database
from models.business import BusinessCreate, Business, BusinessInDB
from models.counter import get_next_sequence_value
from auth import get_current_active_user
from models.user import UserInDB
from models.booking import BookingCreate, Booking
from utils import serialize_doc, serialize_docs
from routes.notifications import notify_booking_created

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
    
    # Ensure allows_bookings has a default value
    if "allows_bookings" not in business_dict:
        business_dict["allows_bookings"] = True
    
    await db.businesses.insert_one(business_dict)
    created_business = await db.businesses.find_one({"id": next_id})
    created_business = serialize_doc(created_business)
    
    return Business(**created_business)


@router.get("/", response_model=List[Business])
async def get_businesses(
    category: Optional[List[str]] = Query(None),
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
        # Filter by multiple categories - business must have at least one of the specified categories
        query["categories"] = {"$in": category}
    
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
        business.setdefault("allows_bookings", True)
        business.setdefault("categories", [])
        business.setdefault("max_capacity", None)
    
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
    business.setdefault("allows_bookings", True)
    
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
    updated_business.setdefault("allows_bookings", True)
    
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
        business.setdefault("allows_bookings", True)
    
    return [Business(**b) for b in businesses]


@router.post("/{business_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def increment_business_view(business_id: int, db = Depends(get_database)):
    """Increment the view count for a business (public endpoint)"""
    await db.businesses.update_one({"id": business_id}, {"$inc": {"views": 1}})
    return None


@router.post("/{business_id}/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(
    business_id: int,
    booking: BookingCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new booking for a business"""
    from utils import check_capacity_availability
    
    # Check if business exists
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check if business allows bookings
    if not business.get("allows_bookings", True):
        raise HTTPException(status_code=400, detail="Este establecimiento no acepta reservas")
    
    # Check capacity availability if business has capacity limits
    if business.get("max_capacity") is not None:
        is_available, current_used, max_capacity = await check_capacity_availability(
            db, business_id, booking.date, booking.time, booking.amount
        )
        
        if not is_available:
            raise HTTPException(
                status_code=400, 
                detail=f"No hay suficiente capacidad disponible. Capacidad máxima: {max_capacity}, actualmente usado: {current_used}, solicitado: {booking.amount}"
            )
    
    # Create booking dict
    booking_dict = booking.model_dump()
    booking_dict["business_id"] = business_id
    booking_dict["user_id"] = str(current_user.id)
    # created_at must be a full datetime for Mongo/BSON
    booking_dict["created_at"] = datetime.utcnow()

    # Initialize price and discount fields
    booking_dict["original_price"] = None
    booking_dict["final_price"] = None
    booking_dict["discount_applied"] = 0.0
    promotion_claim_id = None

    # Validate promotion code if provided
    if booking_dict.get("promotion_code"):
        promotion = await db.promotions.find_one({
            "code": booking_dict["promotion_code"],
            "business_id": business_id,
            "is_active": True
        })
        
        if promotion:
            # Check if user has claimed this promotion and hasn't used it
            claim = await db.promotion_claims.find_one({
                "user_id": current_user.id,
                "promotion_id": promotion["id"],
                "business_id": business_id,
                "used": False
            })
            
            if not claim:
                raise HTTPException(
                    status_code=400,
                    detail="No tienes este código promocional disponible o ya lo usaste"
                )
            
            promotion_claim_id = claim["id"]
            
            # Check if promotion is still valid
            from datetime import date as date_type
            today = date_type.today()
            
            start_date = promotion.get("start_date")
            end_date = promotion.get("end_date")
            
            # Convert to date objects for comparison
            if isinstance(start_date, str):
                start_date = date_type.fromisoformat(start_date)
            elif isinstance(start_date, datetime):
                start_date = start_date.date()
            
            if isinstance(end_date, str):
                end_date = date_type.fromisoformat(end_date)
            elif isinstance(end_date, datetime):
                end_date = end_date.date()
            
            # Check if promotion is valid (compare dates only)
            if start_date and end_date and start_date <= today <= end_date:
                booking_dict["discount_applied"] = promotion.get("discount_percentage", 0.0)
                # If business has a price, calculate the discount
                if business.get("price_level"):
                    # Use price_level as a base price (you can adjust this logic)
                    base_price = business.get("price_level", 0) * 100  # Example conversion
                    booking_dict["original_price"] = base_price
                    discount_amount = base_price * (booking_dict["discount_applied"] / 100)
                    booking_dict["final_price"] = base_price - discount_amount
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"El código promocional ha expirado (válido desde {start_date} hasta {end_date})"
                )
        else:
            raise HTTPException(status_code=400, detail="Código promocional inválido")

    # Mongo/BSON cannot encode python date/time objects directly.
    # Convert the booking date/time to ISO strings before inserting.
    # Pydantic will still parse these strings back to date/time when returning the response.
    if isinstance(booking_dict.get("date"), (datetime,)):
        # if somehow a datetime is present, convert to date string
        booking_dict["date"] = booking_dict["date"].date().isoformat()
    elif booking_dict.get("date") is not None:
        booking_dict["date"] = booking_dict["date"].isoformat()

    if isinstance(booking_dict.get("time"), (datetime,)):
        booking_dict["time"] = booking_dict["time"].time().isoformat()
    elif booking_dict.get("time") is not None:
        booking_dict["time"] = booking_dict["time"].isoformat()

    # Get next sequential ID for booking
    next_id = await get_next_sequence_value("bookings", db)
    booking_dict["id"] = next_id
    booking_dict["status"] = "pending"  # Set default status

    # Insert booking
    await db.bookings.insert_one(booking_dict)
    
    # Mark promotion as used if it was applied
    if promotion_claim_id:
        await db.promotion_claims.update_one(
            {"id": promotion_claim_id},
            {
                "$set": {
                    "used": True,
                    "used_at": datetime.utcnow(),
                    "booking_id": next_id
                }
            }
        )
    
    created_booking = await db.bookings.find_one({"id": next_id})
    created_booking = serialize_doc(created_booking)
    
    # Send notifications (user + business owner)
    await notify_booking_created(
        booking_id=next_id,
        booking_date=str(booking_dict["date"]),
        user_id=current_user.id,
        business_id=business_id,
        business_name=business["name"],
        business_owner_id=int(business["owner_id"]),
        user_name=current_user.full_name,
        db=db
    )
    
    return Booking(**created_booking)


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


@router.get("/owner/capacity-usage")
async def get_capacity_usage(current_user: UserInDB = Depends(get_current_active_user), db = Depends(get_database)):
    """Get capacity usage information for business owner's establishments."""
    user_id = current_user.id if current_user.id is not None else None
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User ID not found"
        )

    # Get businesses with capacity limits
    businesses = await db.businesses.find({
        "owner_id": str(user_id),
        "max_capacity": {"$exists": True, "$ne": None}
    }).to_list(length=100)

    capacity_info = []

    for business in businesses:
        business_id = business["id"]
        max_capacity = business["max_capacity"]

        # Get upcoming confirmed bookings for this business
        from datetime import date
        today = date.today().isoformat()

        upcoming_bookings = await db.bookings.find({
            "business_id": business_id,
            "status": "confirmed",
            "date": {"$gte": today}
        }).sort("date", 1).sort("time", 1).to_list(length=100)

        # Group bookings by date and time
        capacity_usage = {}
        for booking in upcoming_bookings:
            date_key = booking["date"]
            time_key = booking["time"]
            key = f"{date_key} {time_key}"

            if key not in capacity_usage:
                capacity_usage[key] = {
                    "date": date_key,
                    "time": time_key,
                    "used": 0,
                    "max_capacity": max_capacity,
                    "bookings": []
                }

            capacity_usage[key]["used"] += booking.get("amount", 1)
            capacity_usage[key]["bookings"].append({
                "id": booking["id"],
                "amount": booking.get("amount", 1),
                "user_name": f"Usuario {booking['user_id']}"  # Simplified, could join with users table
            })

        business_info = {
            "business_id": business_id,
            "business_name": business["name"],
            "max_capacity": max_capacity,
            "capacity_usage": list(capacity_usage.values())
        }

        capacity_info.append(business_info)

    return capacity_info
