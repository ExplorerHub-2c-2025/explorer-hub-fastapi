from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from database import get_database
from models.booking import Booking, BookingWithBusiness, BookingWithUser, BookingStatus
from auth import get_current_active_user
from models.user import UserInDB
from utils import serialize_doc, serialize_docs
from routes.notifications import (
    notify_booking_confirmed,
    notify_booking_cancelled,
    notify_booking_created
)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("/my-bookings", response_model=List[BookingWithBusiness])
async def get_my_bookings(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all bookings for the current user with business information"""
    user_id = str(current_user.id)
    
    # Get user's bookings
    cursor = db.bookings.find({"user_id": user_id}).sort("created_at", -1)
    bookings = await cursor.to_list(length=100)
    bookings = serialize_docs(bookings)
    
    # Enrich with business information
    enriched_bookings = []
    for booking in bookings:
        business = await db.businesses.find_one({"id": booking["business_id"]})
        if business:
            business = serialize_doc(business)
            booking["business_name"] = business.get("name", "Negocio no disponible")
            booking["business_categories"] = business.get("categories", [])
            booking["business_image"] = business.get("images", [None])[0] if business.get("images") else None
        else:
            booking["business_name"] = "Negocio no disponible"
            booking["business_category"] = ""
            booking["business_image"] = None
        
        # Ensure default values for optional fields
        booking.setdefault("discount_applied", 0.0)
        booking.setdefault("original_price", None)
        booking.setdefault("final_price", None)
        booking.setdefault("promotion_code", None)
        booking.setdefault("status", "pending")
        
        enriched_bookings.append(BookingWithBusiness(**booking))
    
    return enriched_bookings


@router.get("/business/{business_id}", response_model=List[BookingWithUser])
async def get_business_bookings(
    business_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all bookings for a business (only by business owner)"""
    # Verify business exists and user is owner
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if business["owner_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only business owner can view bookings"
        )
    
    # Get business bookings
    cursor = db.bookings.find({"business_id": business_id}).sort("created_at", -1)
    bookings = await cursor.to_list(length=500)
    bookings = serialize_docs(bookings)
    
    # Enrich with user information
    enriched_bookings = []
    for booking in bookings:
        user = await db.users.find_one({"id": int(booking["user_id"])})
        if user:
            user = serialize_doc(user)
            booking["user_name"] = user.get("full_name", "Usuario desconocido")
            booking["user_email"] = user.get("email", "Sin email")
        else:
            booking["user_name"] = "Usuario desconocido"
            booking["user_email"] = "Sin email"
        
        # Ensure default values
        booking.setdefault("discount_applied", 0.0)
        booking.setdefault("original_price", None)
        booking.setdefault("final_price", None)
        booking.setdefault("promotion_code", None)
        booking.setdefault("status", "pending")
        
        enriched_bookings.append(BookingWithUser(**booking))
    
    return enriched_bookings


@router.put("/{booking_id}/confirm", response_model=Booking)
async def confirm_booking(
    booking_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Confirm a booking (only by business owner)"""
    # Get booking
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user is business owner
    business = await db.businesses.find_one({"id": booking["business_id"]})
    if not business or business["owner_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only business owner can confirm bookings"
        )
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "confirmed"}}
    )
    
    updated_booking = await db.bookings.find_one({"id": booking_id})
    updated_booking = serialize_doc(updated_booking)
    
    # Send notification to user
    user = await db.users.find_one({"id": int(booking["user_id"])})
    if user:
        await notify_booking_confirmed(
            booking_id=booking_id,
            booking_date=str(booking["date"]),
            user_id=int(booking["user_id"]),
            business_name=business["name"],
            db=db
        )
    
    return Booking(**updated_booking)


@router.put("/{booking_id}/cancel", response_model=Booking)
async def cancel_booking(
    booking_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Cancel a booking (by business owner or user who made the booking)"""
    # Get booking
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user is business owner or the user who made the booking
    business = await db.businesses.find_one({"id": booking["business_id"]})
    is_owner = business and business["owner_id"] == str(current_user.id)
    is_booking_user = booking["user_id"] == str(current_user.id)
    
    if not (is_owner or is_booking_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking"
        )
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "cancelled"}}
    )
    
    # If booking had a promo code, release it
    if booking.get("promotion_code"):
        await db.promotion_claims.update_one(
            {"booking_id": booking_id},
            {"$set": {"used": False, "used_at": None, "booking_id": None}}
        )
    
    updated_booking = await db.bookings.find_one({"id": booking_id})
    updated_booking = serialize_doc(updated_booking)
    
    # Send notification to user if cancelled by business owner
    if is_owner and not is_booking_user:
        await notify_booking_cancelled(
            booking_id=booking_id,
            booking_date=str(booking["date"]),
            user_id=int(booking["user_id"]),
            business_name=business["name"],
            db=db
        )
    
    return Booking(**updated_booking)
