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
from flash_sale_checker import check_promotion_after_use
from pricing_calculator import calculate_price_with_categories, apply_promotion_discount
from services.geocoding_service import GeocodingService

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
    
    # Geocode the location to get coordinates
    if "location" in business_dict:
        business_dict["location"] = await GeocodingService.geocode_business_location(
            business_dict["location"]
        )
    
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
    
    # Geocode the location if it was updated
    if "location" in update_data:
        update_data["location"] = await GeocodingService.geocode_business_location(
            update_data["location"]
        )
    
    update_data["updated_at"] = datetime.utcnow()
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


@router.post("/{business_id}/calculate-price")
async def calculate_booking_price(
    business_id: int,
    booking_details: dict,
    promotion_code: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """
    Calculate the price for a booking with flexible pricing models
    
    booking_details puede incluir:
    - Para Ticket: adult_count, senior_count, child_count
    - Para Hotel: nights
    - Para Restaurant: people
    - Para Activity: people
    - Para Wellness: booking_type ("single"/"package"), sessions
    - Para Entertainment: ticket_type ("general"/"vip"), quantity, is_student
    """
    from datetime import date as date_type
    
    # Check if business exists
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Calcular precio base usando el nuevo sistema
    price_result = calculate_price_with_categories(business, booking_details)
    
    # Si hay errores, retornarlos
    if price_result.get("errors"):
        return {
            "original_price": 0,
            "final_price": 0,
            "discount_percentage": 0,
            "promotion_applied": None,
            "errors": price_result["errors"],
            "pricing_type": price_result.get("pricing_type")
        }
    
    original_price = price_result["original_price"]
    
    if original_price == 0:
        return {
            "original_price": 0,
            "final_price": 0,
            "discount_percentage": 0,
            "promotion_applied": None,
            "message": "Precio calculado es $0. Verifica los datos ingresados.",
            "breakdown": price_result.get("breakdown"),
            "pricing_type": price_result.get("pricing_type")
        }
    
    final_price = original_price
    discount_percentage = 0
    discount_amount = 0
    promotion_applied = None
    
    # Check for automatic promotions first
    today = date_type.today()
    automatic_promotion = await db.promotions.find_one({
        "business_id": business_id,
        "is_active": True,
        "promotion_type": "automatic",
        "start_date": {"$lte": today.isoformat()},
        "end_date": {"$gte": today.isoformat()}
    })
    
    # Check if there are usage limits
    if automatic_promotion:
        max_uses = automatic_promotion.get("max_uses")
        if max_uses and automatic_promotion.get("current_uses", 0) >= max_uses:
            automatic_promotion = None
    
    # Apply automatic promotion
    if automatic_promotion:
        min_purchase = automatic_promotion.get("min_purchase") or 0
        if original_price >= min_purchase:
            promotion_applied = serialize_doc(automatic_promotion)
            discount_result = apply_promotion_discount(original_price, automatic_promotion)
            final_price = discount_result["final_price"]
            discount_amount = discount_result["discount_amount"]
            discount_percentage = discount_result["discount_percentage"]
    
    # Check for code-based promotion if provided (overrides automatic)
    if promotion_code:
        code_promotion = await db.promotions.find_one({
            "code": promotion_code,
            "business_id": business_id,
            "is_active": True,
            "promotion_type": "code"
        })
        
        if code_promotion:
            # Check if user has claimed this promotion
            claim = await db.promotion_claims.find_one({
                "user_id": current_user.id,
                "promotion_id": code_promotion["id"],
                "business_id": business_id,
                "used": False
            })
            
            if claim:
                # Validate dates
                start_date = code_promotion.get("start_date")
                end_date = code_promotion.get("end_date")
                
                if isinstance(start_date, str):
                    start_date = date_type.fromisoformat(start_date)
                if isinstance(end_date, str):
                    end_date = date_type.fromisoformat(end_date)
                
                if start_date <= today <= end_date:
                    min_purchase = code_promotion.get("min_purchase") or 0
                    if original_price >= min_purchase:
                        promotion_applied = serialize_doc(code_promotion)
                        discount_result = apply_promotion_discount(original_price, code_promotion)
                        final_price = discount_result["final_price"]
                        discount_amount = discount_result["discount_amount"]
                        discount_percentage = discount_result["discount_percentage"]
    
    return {
        "original_price": round(original_price, 2),
        "final_price": round(final_price, 2),
        "discount_percentage": round(discount_percentage, 2),
        "discount_amount": round(discount_amount, 2),
        "promotion_applied": promotion_applied,
        "breakdown": price_result.get("breakdown"),
        "warnings": price_result.get("warnings"),
        "pricing_type": price_result.get("pricing_type")
    }


@router.post("/{business_id}/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(
    business_id: int,
    booking: BookingCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new booking for a business"""
    from utils import check_capacity_availability
    from datetime import date as date_type
    
    # Check if business exists
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check if business allows bookings
    if not business.get("allows_bookings", True):
        raise HTTPException(status_code=400, detail="Este establecimiento no acepta reservas")
    
    # Calculate total people from ticket selection or fallback to amount
    total_people = booking.amount
    if booking.ticket_selection:
        total_people = (
            booking.ticket_selection.adult_count +
            booking.ticket_selection.senior_count +
            booking.ticket_selection.child_count
        )
    
    # Check capacity availability if business has capacity limits
    if business.get("max_capacity") is not None:
        is_available, current_used, max_capacity = await check_capacity_availability(
            db, business_id, booking.date, booking.time, total_people
        )
        
        if not is_available:
            raise HTTPException(
                status_code=400, 
                detail=f"No hay suficiente capacidad disponible. Capacidad máxima: {max_capacity}, actualmente usado: {current_used}, solicitado: {total_people}"
            )
    
    # Create booking dict
    booking_dict = booking.model_dump()
    booking_dict["business_id"] = business_id
    booking_dict["user_id"] = str(current_user.id)
    booking_dict["created_at"] = datetime.utcnow()

    # Calculate prices based on ticket selection
    original_price = 0.0
    final_price = 0.0
    discount_applied = 0.0
    applied_promotion_id = None
    promotion_claim_id = None
    
    # Get ticket pricing from business
    ticket_pricing = business.get("ticket_pricing", {})
    
    if booking.ticket_selection and ticket_pricing:
        # Calculate original price
        if ticket_pricing.get("adult_price") and booking.ticket_selection.adult_count > 0:
            original_price += ticket_pricing["adult_price"] * booking.ticket_selection.adult_count
        if ticket_pricing.get("senior_price") and booking.ticket_selection.senior_count > 0:
            original_price += ticket_pricing["senior_price"] * booking.ticket_selection.senior_count
        if ticket_pricing.get("child_price") and booking.ticket_selection.child_count > 0:
            original_price += ticket_pricing["child_price"] * booking.ticket_selection.child_count
        
        final_price = original_price
    
    # Check for automatic promotions first
    today = date_type.today()
    automatic_promotion = await db.promotions.find_one({
        "business_id": business_id,
        "is_active": True,
        "promotion_type": "automatic",
        "start_date": {"$lte": today.isoformat()},
        "end_date": {"$gte": today.isoformat()}
    })
    
    # Check if there are usage limits
    if automatic_promotion:
        max_uses = automatic_promotion.get("max_uses")
        if max_uses and automatic_promotion.get("current_uses", 0) >= max_uses:
            automatic_promotion = None  # Promotion exhausted
    
    # Apply automatic promotion if available
    if automatic_promotion and original_price > 0:
        min_purchase = automatic_promotion.get("min_purchase") or 0
        if original_price >= min_purchase:
            applied_promotion_id = automatic_promotion["id"]
            
            if automatic_promotion.get("discount_percentage"):
                discount_applied = automatic_promotion["discount_percentage"]
                discount_amount = original_price * (discount_applied / 100)
                final_price = original_price - discount_amount
            elif automatic_promotion.get("discount_amount"):
                discount_amount = min(automatic_promotion["discount_amount"], original_price)
                discount_applied = (discount_amount / original_price) * 100 if original_price > 0 else 0
                final_price = original_price - discount_amount
            
            # Increment promotion usage
            await db.promotions.update_one(
                {"id": automatic_promotion["id"]},
                {"$inc": {"current_uses": 1}}
            )
            
            # Verificar si debe convertirse en flash sale por stock bajo
            await check_promotion_after_use(db, automatic_promotion["id"])
    
    # Check for code-based promotion if provided (overrides automatic)
    if booking_dict.get("promotion_code"):
        promotion = await db.promotions.find_one({
            "code": booking_dict["promotion_code"],
            "business_id": business_id,
            "is_active": True,
            "promotion_type": "code"
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
            
            # Check if promotion is valid
            if start_date and end_date and start_date <= today <= end_date:
                min_purchase = promotion.get("min_purchase") or 0
                if original_price >= min_purchase:
                    applied_promotion_id = promotion["id"]
                    
                    # Calculate new discount
                    if promotion.get("discount_percentage"):
                        discount_applied = promotion["discount_percentage"]
                        discount_amount = original_price * (discount_applied / 100)
                        final_price = original_price - discount_amount
                    elif promotion.get("discount_amount"):
                        discount_amount = min(promotion["discount_amount"], original_price)
                        discount_applied = (discount_amount / original_price) * 100 if original_price > 0 else 0
                        final_price = original_price - discount_amount
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"El monto mínimo de compra es ${min_purchase:.2f}"
                    )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"El código promocional ha expirado (válido desde {start_date} hasta {end_date})"
                )
        else:
            raise HTTPException(status_code=400, detail="Código promocional inválido")
    
    # Update booking dict with calculated values
    booking_dict["original_price"] = original_price if original_price > 0 else None
    booking_dict["final_price"] = final_price if final_price > 0 else None
    booking_dict["discount_applied"] = discount_applied
    booking_dict["applied_promotion_id"] = applied_promotion_id
    booking_dict["amount"] = total_people

    # Convert date/time to ISO strings for MongoDB
    if isinstance(booking_dict.get("date"), (datetime,)):
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
    booking_dict["status"] = "pending"

    # Insert booking
    await db.bookings.insert_one(booking_dict)
    
    # Mark code-based promotion as used if it was applied
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
    
    # Send notifications
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
