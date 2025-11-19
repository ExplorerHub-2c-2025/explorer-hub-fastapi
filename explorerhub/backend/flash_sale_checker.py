"""
Sistema automático de detección de ofertas flash
Se ejecuta al inicio del servidor y cuando se usa un código
"""
from datetime import datetime, timedelta, date
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

async def check_and_update_flash_sales(db: AsyncIOMotorDatabase):
    """
    Verifica todas las promociones activas y marca como flash sale si:
    1. Faltan 24 horas o menos para end_date
    2. Quedan 5 códigos o menos disponibles
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
            
            # 1. Chequear si faltan 24h o menos para end_date
            end_date_str = promo.get("end_date")
            if end_date_str:
                if isinstance(end_date_str, str):
                    end_date = date.fromisoformat(end_date_str)
                else:
                    end_date = end_date_str
                
                # Calcular diferencia en días
                days_remaining = (end_date - today).days
                
                # Si falta 1 día o menos (incluyendo hoy)
                if days_remaining <= 1:
                    should_be_flash = True
                    reason.append(f"quedan {days_remaining} días")
            
            # 2. Chequear si quedan 5 códigos o menos
            max_uses = promo.get("max_uses")
            if max_uses is not None:
                current_uses = promo.get("current_uses", 0)
                remaining = max_uses - current_uses
                
                if remaining <= 5 and remaining > 0:
                    should_be_flash = True
                    reason.append(f"quedan {remaining} códigos")
            
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


async def check_promotion_after_use(db: AsyncIOMotorDatabase, promotion_id: int):
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
            return False
        
        current_uses = promo.get("current_uses", 0)
        remaining = max_uses - current_uses
        
        # Si quedan 5 o menos, marcar como flash sale
        if remaining <= 5 and remaining > 0:
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
