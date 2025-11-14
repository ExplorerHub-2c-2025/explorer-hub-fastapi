from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from models.notification import (
    Notification, 
    NotificationCreate, 
    NotificationUpdate,
    NotificationStats,
    NotificationType
)
from models.counter import get_next_sequence_value
from database import get_database
from auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


async def create_notification(
    notification_data: NotificationCreate,
    db = Depends(get_database)
) -> Notification:
    """
    Helper function to create a notification in the database.
    Can be called from other routes when events occur.
    """
    notification_dict = notification_data.dict()
    notification_dict["id"] = await get_next_sequence_value("notifications", db)
    notification_dict["read"] = False
    notification_dict["created_at"] = datetime.utcnow()
    
    await db.notifications.insert_one(notification_dict)
    
    return Notification(**notification_dict)


@router.get("", response_model=List[Notification])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get notifications for the current user.
    """
    user_id = current_user.id
    
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query).sort(
        "created_at", -1
    ).skip(skip).limit(limit).to_list(length=limit)
    
    # Convert datetime objects to ISO format
    for notif in notifications:
        if "_id" in notif:
            del notif["_id"]
        if isinstance(notif.get("created_at"), datetime):
            notif["created_at"] = notif["created_at"].isoformat()
    
    return notifications


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get notification statistics for the current user.
    """
    user_id = current_user.id
    
    total = await db.notifications.count_documents({"user_id": user_id})
    unread = await db.notifications.count_documents({"user_id": user_id, "read": False})
    
    return NotificationStats(total=total, unread=unread)


@router.patch("/mark-all-read")
async def mark_all_as_read(
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Mark all notifications as read for the current user.
    """
    user_id = current_user.id
    
    result = await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {
        "message": "All notifications marked as read",
        "modified_count": result.modified_count
    }


@router.patch("/{notification_id}", response_model=Notification)
async def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Update a notification (e.g., mark as read).
    """
    user_id = current_user.id
    
    # Verify notification belongs to user
    notification = await db.notifications.find_one({
        "id": notification_id,
        "user_id": user_id
    })
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Update notification
    update_data = {k: v for k, v in notification_update.dict().items() if v is not None}
    
    if update_data:
        await db.notifications.update_one(
            {"id": notification_id, "user_id": user_id},
            {"$set": update_data}
        )
    
    # Get updated notification
    updated_notification = await db.notifications.find_one({
        "id": notification_id,
        "user_id": user_id
    })
    
    if "_id" in updated_notification:
        del updated_notification["_id"]
    if isinstance(updated_notification.get("created_at"), datetime):
        updated_notification["created_at"] = updated_notification["created_at"].isoformat()
    
    return Notification(**updated_notification)


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Delete a notification.
    """
    user_id = current_user.id
    
    result = await db.notifications.delete_one({
        "id": notification_id,
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification deleted successfully"}


# Helper functions to create notifications for specific events

async def notify_price_change(
    business_id: int,
    business_name: str,
    old_price: float,
    new_price: float,
    interested_user_ids: List[int],
    db
):
    """Create notifications for users interested in a business when price changes."""
    for user_id in interested_user_ids:
        notification = NotificationCreate(
            user_id=user_id,
            type=NotificationType.price_change,
            title="Cambio de precio",
            description=f"{business_name} actualizó su precio de ${old_price:,.0f} a ${new_price:,.0f}.",
            link=f"/business/{business_id}",
            context_id=business_id
        )
        await create_notification(notification, db)


async def notify_address_change(
    business_id: int,
    business_name: str,
    new_address: str,
    interested_user_ids: List[int],
    db
):
    """Create notifications for users interested in a business when address changes."""
    for user_id in interested_user_ids:
        notification = NotificationCreate(
            user_id=user_id,
            type=NotificationType.address_change,
            title="Cambio de ubicación",
            description=f"{business_name} ha actualizado su dirección a {new_address}.",
            link=f"/business/{business_id}",
            context_id=business_id
        )
        await create_notification(notification, db)


async def notify_new_promotion(
    business_id: int,
    business_name: str,
    promotion_code: str,
    discount: float,
    interested_user_ids: List[int],
    db
):
    """Create notifications when a new promotion is created."""
    for user_id in interested_user_ids:
        notification = NotificationCreate(
            user_id=user_id,
            type=NotificationType.new_promotion,
            title="Nueva promoción disponible",
            description=f"¡{business_name} tiene un {discount}% de descuento! Código: {promotion_code}",
            link=f"/business/{business_id}",
            context_id=business_id
        )
        await create_notification(notification, db)


async def notify_booking_created(
    booking_id: int,
    booking_date: str,
    user_id: int,
    business_id: int,
    business_name: str,
    business_owner_id: int,
    user_name: str,
    db
):
    """Create notifications when a booking is created."""
    # Notify user
    user_notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.booking_pending,
        title="Reserva pendiente",
        description=f"Su reserva en {business_name} el día {booking_date} está pendiente de confirmación.",
        link="/bookings",
        context_id=booking_id
    )
    await create_notification(user_notification, db)
    
    # Notify business owner
    business_notification = NotificationCreate(
        user_id=business_owner_id,
        type=NotificationType.new_booking,
        title="Nueva reserva",
        description=f"{user_name} ha realizado una reserva en {business_name} el día {booking_date}.",
        link="/dashboard/business/bookings",
        context_id=booking_id
    )
    await create_notification(business_notification, db)


async def notify_booking_confirmed(
    booking_id: int,
    booking_date: str,
    user_id: int,
    business_name: str,
    db
):
    """Create notification when booking is confirmed."""
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.booking_confirmed,
        title="Reserva confirmada",
        description=f"Su reserva en {business_name} el día {booking_date} ha sido confirmada.",
        link="/bookings",
        context_id=booking_id
    )
    await create_notification(notification, db)


async def notify_booking_cancelled(
    booking_id: int,
    booking_date: str,
    user_id: int,
    business_name: str,
    db
):
    """Create notification when booking is cancelled."""
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.booking_cancelled,
        title="Reserva cancelada",
        description=f"Su reserva en {business_name} el día {booking_date} ha sido cancelada.",
        link="/bookings",
        context_id=booking_id
    )
    await create_notification(notification, db)


async def notify_booking_self_cancelled(
    booking_id: int,
    booking_date: str,
    user_id: int,
    business_name: str,
    db
):
    """Create notification when user cancels their own booking."""
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.booking_cancelled,
        title="Reserva cancelada",
        description=f"Has cancelado tu reserva en {business_name} el día {booking_date}.",
        link="/bookings",
        context_id=booking_id
    )
    await create_notification(notification, db)


async def notify_new_review(
    review_id: int,
    business_id: int,
    business_name: str,
    business_owner_id: int,
    user_name: str,
    rating: int,
    db
):
    """Create notification when a new review is posted."""
    notification = NotificationCreate(
        user_id=business_owner_id,
        type=NotificationType.new_review,
        title="Nueva reseña",
        description=f"{user_name} dejó una reseña de {rating} estrellas en {business_name}.",
        link="/reviews",
        context_id=review_id
    )
    await create_notification(notification, db)


async def notify_review_response(
    review_id: int,
    user_id: int,
    business_name: str,
    responder_name: str,
    db
):
    """Create notification when someone responds to a review."""
    notification = NotificationCreate(
        user_id=user_id,
        type=NotificationType.review_response,
        title="Respuesta a reseña",
        description=f"{responder_name} respondió a tu comentario en {business_name}.",
        link="/reviews",
        context_id=review_id
    )
    await create_notification(notification, db)


async def notify_capacity_released(
    released_count: int,
    db
):
    """Create notifications for business owners when capacity slots are released."""
    if released_count == 0:
        return

    # Find all business owners who have businesses with capacity limits
    businesses_with_capacity = await db.businesses.find({
        "max_capacity": {"$exists": True, "$ne": None},
        "is_active": True
    }).to_list(length=None)

    # Get unique business owner IDs
    owner_ids = list(set(int(business["owner_id"]) for business in businesses_with_capacity))

    # Notify each business owner
    for owner_id in owner_ids:
        notification = NotificationCreate(
            user_id=owner_id,
            type=NotificationType.address_change,  # Reusing existing type, could create new one
            title="Cupos liberados",
            description=f"Se han liberado {released_count} cupos de reservas expiradas en tus establecimientos.",
            link="/dashboard/business",
            context_id=0  # No specific context
        )
        await create_notification(notification, db)


async def notify_new_follower(
    follower_id: int,
    follower_name: str,
    followed_user_id: int,
    db
):
    """Create notification when someone starts following a user."""
    notification = NotificationCreate(
        user_id=followed_user_id,
        type=NotificationType.new_follower,
        title="Nuevo seguidor",
        description=f"{follower_name} comenzó a seguirte.",
        link=f"/profile/{follower_id}",
        context_id=follower_id
    )
    await create_notification(notification, db)
