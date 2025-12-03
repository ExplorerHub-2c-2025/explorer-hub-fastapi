from datetime import datetime as dt, timedelta
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from models.business import Business
from utils import serialize_doc


async def apply_subscription_update(
    db,
    *,
    business_id: int,
    tier: str,
    duration_days: int,
    business: Optional[Dict[str, Any]] = None,
) -> Business:
    if business is None:
        business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    if tier not in ["basic", "premium", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tier debe ser 'basic', 'premium' o 'enterprise'",
        )

    if not duration_days or duration_days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="duration_days debe ser un número positivo",
        )

    current_time = dt.utcnow()
    subscription_ends_at = current_time + timedelta(days=duration_days)

    if business.get("is_subscribed") and business.get("subscription_ends_at"):
        existing_end = business["subscription_ends_at"]
        if isinstance(existing_end, dt) and existing_end > current_time:
            subscription_ends_at = existing_end + timedelta(days=duration_days)

    await db.businesses.update_one(
        {"id": business_id},
        {
            "$set": {
                "is_subscribed": True,
                "subscription_tier": tier,
                "subscription_ends_at": subscription_ends_at,
                "updated_at": current_time,
            }
        },
    )

    updated_business = await db.businesses.find_one({"id": business_id})
    updated_business = serialize_doc(updated_business)

    defaults: Dict[str, Any] = {
        "rating": 0.0,
        "views": 0,
        "review_count": 0,
        "is_active": True,
        "allows_bookings": True,
    }

    for key, value in defaults.items():
        updated_business.setdefault(key, value)

    updated_business.setdefault("created_at", dt.utcnow())

    return Business(**updated_business)

