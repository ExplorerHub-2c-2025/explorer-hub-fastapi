from fastapi import APIRouter, Depends, HTTPException, status
from database import get_database
from auth import get_current_active_user
from models.user import UserInDB

router = APIRouter(prefix="/api/migrations", tags=["migrations"])


@router.post("/add-subscription-fields")
async def migrate_add_subscription_fields(
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """
    Migración: Agregar campos de suscripción a negocios existentes.
    Solo admin puede ejecutar migraciones.
    """
    # Verificar que el usuario sea admin (puedes ajustar esta validación)
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden ejecutar migraciones"
        )
    
    try:
        # Actualizar todos los negocios que no tienen los campos de suscripción
        result = await db.businesses.update_many(
            {
                "$or": [
                    {"is_subscribed": {"$exists": False}},
                    {"subscription_tier": {"$exists": False}},
                    {"subscription_ends_at": {"$exists": False}}
                ]
            },
            {
                "$set": {
                    "is_subscribed": False,
                    "subscription_tier": None,
                    "subscription_ends_at": None
                }
            }
        )
        
        return {
            "status": "success",
            "message": "Migración completada exitosamente",
            "businesses_updated": result.modified_count,
            "businesses_matched": result.matched_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante la migración: {str(e)}"
        )
