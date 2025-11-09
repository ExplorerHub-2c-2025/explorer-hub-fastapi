"""
Utility functions for the backend
"""
from typing import Dict, List, Any
from datetime import datetime, date, time
from motor.motor_asyncio import AsyncIOMotorDatabase


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert MongoDB document to JSON-serializable format
    Removes _id field and uses sequential 'id' field
    """
    if doc is None:
        return None
    
    # Create a copy to avoid modifying original
    result = dict(doc)
    
    # Remove _id if present (we use sequential 'id' instead)
    if "_id" in result:
        del result["_id"]
    
    # Recursively process nested documents
    for key, value in list(result.items()):
        if isinstance(value, list):
            result[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
    
    return result


def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert list of MongoDB documents to JSON-serializable format
    """
    return [serialize_doc(doc) for doc in docs]


def ensure_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure document has an 'id' field
    """
    if doc and "_id" in doc:
        del doc["_id"]
    return doc


async def get_capacity_used_for_business_date_time(
    db: AsyncIOMotorDatabase,
    business_id: int,
    booking_date: date,
    booking_time: time
) -> int:
    """
    Get the total capacity used for a business at a specific date and time
    Only counts confirmed bookings
    """
    # Convert to ISO strings for MongoDB query
    date_str = booking_date.isoformat()
    time_str = booking_time.isoformat()
    
    # Find all confirmed bookings for this business on this date and time
    bookings = await db.bookings.find({
        "business_id": business_id,
        "date": date_str,
        "time": time_str,
        "status": "confirmed"
    }).to_list(length=None)
    
    # Sum up the amount (number of people) from all bookings
    total_capacity_used = sum(booking.get("amount", 0) for booking in bookings)
    return total_capacity_used


async def check_capacity_availability(
    db: AsyncIOMotorDatabase,
    business_id: int,
    booking_date: date,
    booking_time: time,
    requested_amount: int
) -> tuple[bool, int, int]:
    """
    Check if there's enough capacity for a booking
    Returns: (is_available, current_used, max_capacity)
    """
    # Get business info
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        return False, 0, 0
    
    max_capacity = business.get("max_capacity")
    if max_capacity is None:
        # No capacity limit set, always available
        return True, 0, 0
    
    # Get current capacity used
    current_used = await get_capacity_used_for_business_date_time(
        db, business_id, booking_date, booking_time
    )
    
    # Check if there's enough capacity
    is_available = (current_used + requested_amount) <= max_capacity
    
    return is_available, current_used, max_capacity


async def release_expired_capacity_slots(db: AsyncIOMotorDatabase):
    """
    Release capacity slots for bookings that have passed their date/time
    This should be called periodically (e.g., via a background task)
    """
    now = datetime.utcnow()
    current_date_str = now.date().isoformat()
    current_time_str = now.time().isoformat()
    
    # Find all confirmed bookings that have passed their date/time
    expired_bookings = await db.bookings.find({
        "status": "confirmed",
        "$or": [
            {"date": {"$lt": current_date_str}},  # Past dates
            {"$and": [
                {"date": current_date_str},  # Today
                {"time": {"$lt": current_time_str}}  # Past time
            ]}
        ]
    }).to_list(length=None)
    
    # These bookings are now "expired" - their capacity slots are automatically freed
    # We don't need to do anything special since the capacity calculation
    # only counts current confirmed bookings
    
    # Optional: Log or notify about expired bookings
    if expired_bookings:
        print(f"Released capacity for {len(expired_bookings)} expired bookings")
    
    return len(expired_bookings)
