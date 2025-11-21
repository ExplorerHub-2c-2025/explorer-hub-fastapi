"""
Sistema automático de detección de ofertas flash
Se ejecuta al inicio del servidor y cuando se usa un código
"""
from datetime import datetime, timedelta, date
from typing import TYPE_CHECKING

# motor is optional for lightweight local tests; import only for type checking
if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

async def deactivate_expired_promotions(db):
    """
    Desactiva automáticamente las promociones cuya end_date ya pasó.
    Esta función se ejecuta periódicamente para mantener la base de datos limpia.
    """
    try:
        today = date.today()
        
        # Buscar todas las promociones activas
        active_promotions = await db.promotions.find({
            "is_active": True
        }).to_list(length=1000)
        
        deactivated_count = 0
        
        for promo in active_promotions:
            # Parse end_date if present
            end_date = None
            end_date_str = promo.get("end_date")
            if end_date_str:
                if isinstance(end_date_str, str):
                    try:
                        end_date = date.fromisoformat(end_date_str)
                    except Exception:
                        end_date = None
                else:
                    end_date = end_date_str
            
            # Verificar si la promoción ya expiró (end_date < today)
            if end_date and end_date < today:
                await db.promotions.update_one(
                    {"id": promo.get("id")},
                    {
                        "$set": {
                            "is_active": False,
                            "is_flash_sale": False
                        }
                    }
                )
                logger.info(
                    f"⏰ DESACTIVADA - Promoción #{promo.get('id')} '{promo.get('title')}' "
                    f"(expiró el {end_date})"
                )
                deactivated_count += 1
        
        if deactivated_count > 0:
            logger.info(f"🔄 {deactivated_count} promociones expiradas desactivadas")
        
        return deactivated_count
        
    except Exception as e:
        logger.error(f"❌ Error al desactivar promociones expiradas: {e}")
        return 0


async def check_and_update_flash_sales(db):
    """
    Verifica todas las promociones activas y marca como flash sale si:
    1. Expiran hoy (end_date == today)
    2. Quedan menos de 5 códigos disponibles (strictly < 5)
    
    NOTA: Esta función NO desactiva promociones expiradas.
    Para eso usa deactivate_expired_promotions().
    """
    try:
        now = datetime.now()
        today = date.today()
        
        # Buscar todas las promociones activas
        active_promotions = await db.promotions.find({
            "is_active": True
        }).to_list(length=1000)
        
        updated_count = 0
        
        for promo in active_promotions:
            should_be_flash = False
            reason = []

            # Parse end_date if present
            end_date = None
            end_date_str = promo.get("end_date")
            if end_date_str:
                if isinstance(end_date_str, str):
                    try:
                        end_date = date.fromisoformat(end_date_str)
                    except Exception:
                        end_date = None
                else:
                    end_date = end_date_str

            # 1. Chequear si expira hoy (menos de 24h -> mismo día)
            low_time = False
            if end_date and end_date == today:
                low_time = True
                reason.append("expira hoy")

            # 2. Chequear disponibilidad de códigos
            low_remaining = False
            max_uses = promo.get("max_uses")
            remaining = None
            
            if max_uses is None:
                # max_uses: null significa usos ilimitados -> califica como flash
                low_remaining = True
                reason.append("usos ilimitados")
            else:
                # Si tiene límite, verificar si quedan menos de 5 códigos
                current_uses = promo.get("current_uses", 0)
                remaining = max_uses - current_uses
                if remaining < 5 and remaining > 0:
                    low_remaining = True
                    reason.append(f"quedan {remaining} códigos")

            # Una oferta flash debe cumplir AMBAS condiciones:
            # - Expira hoy
            # - Tiene usos ilimitados O quedan menos de 5 códigos
            if low_time and low_remaining:
                should_be_flash = True
            
            # Actualizar si cambió el estado
            current_flash_status = promo.get("is_flash_sale", False)
            
            if should_be_flash != current_flash_status:
                # Actualizar promoción
                await db.promotions.update_one(
                    {"id": promo.get("id")},
                    {
                        "$set": {
                            "is_flash_sale": should_be_flash,
                            # Si se convierte en flash sale, establecer created_at si no existe
                            "created_at": promo.get("created_at") or now.isoformat()
                        }
                    }
                )
                
                status = "✅ FLASH SALE" if should_be_flash else "⚪ Normal"
                logger.info(
                    f"{status} - Promoción #{promo.get('id')} '{promo.get('title')}' "
                    f"({', '.join(reason)})"
                )
                updated_count += 1
        
        if updated_count > 0:
            logger.info(f"🔄 Actualizadas {updated_count} promociones")
        
        return updated_count
        
    except Exception as e:
        logger.error(f"❌ Error al verificar flash sales: {e}")
        return 0


async def check_promotion_after_use(db, promotion_id: int):
    """
    Verifica una promoción específica después de ser usada
    Marca como flash sale si quedan 5 códigos o menos
    """
    try:
        promo = await db.promotions.find_one({"id": promotion_id})
        
        if not promo:
            return False
        
        max_uses = promo.get("max_uses")
        if max_uses is None:
            # Si no tiene límite de usos, verificar solo si expira hoy
            end_date = None
            end_date_str = promo.get("end_date")
            if end_date_str:
                if isinstance(end_date_str, str):
                    try:
                        end_date = date.fromisoformat(end_date_str)
                    except Exception:
                        end_date = None
                else:
                    end_date = end_date_str
            
            # Si expira hoy, marcar como flash sale
            if end_date == date.today():
                current_flash_status = promo.get("is_flash_sale", False)
                
                if not current_flash_status:
                    now = datetime.now()
                    await db.promotions.update_one(
                        {"id": promotion_id},
                        {
                            "$set": {
                                "is_flash_sale": True,
                                "created_at": promo.get("created_at") or now.isoformat(),
                                "flash_duration_hours": 24
                            }
                        }
                    )
                    
                    logger.warning(
                        f"🔥 NUEVA FLASH SALE - Promoción #{promotion_id} '{promo.get('title')}' "
                        f"(usos ilimitados, expira hoy)"
                    )
                    return True
            return False
        
        # Si tiene límite de usos, verificar códigos restantes
        current_uses = promo.get("current_uses", 0)
        remaining = max_uses - current_uses
        
        # Parse end_date for comparison
        end_date = None
        end_date_str = promo.get("end_date")
        if end_date_str:
            if isinstance(end_date_str, str):
                try:
                    end_date = date.fromisoformat(end_date_str)
                except Exception:
                    end_date = None
            else:
                end_date = end_date_str

        # Si quedan menos de 5 y expira hoy, marcar como flash sale
        if remaining < 5 and remaining > 0 and end_date == date.today():
            current_flash_status = promo.get("is_flash_sale", False)
            
            if not current_flash_status:
                now = datetime.now()
                await db.promotions.update_one(
                    {"id": promotion_id},
                    {
                        "$set": {
                            "is_flash_sale": True,
                            "created_at": promo.get("created_at") or now.isoformat(),
                            "flash_duration_hours": 24  # Por defecto 24h
                        }
                    }
                )
                
                logger.warning(
                    f"🔥 NUEVA FLASH SALE - Promoción #{promotion_id} '{promo.get('title')}' "
                    f"(quedan {remaining} códigos)"
                )
                return True
        
        return False
        
    except Exception as e:
        logger.error(f"❌ Error al verificar promoción #{promotion_id}: {e}")
        return False
