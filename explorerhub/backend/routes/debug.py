"""
Endpoint temporal para diagnosticar promociones
Agregar a main.py temporalmente
"""

from fastapi import APIRouter, Depends
from database import get_database
from datetime import date

debug_router = APIRouter(prefix="/api/debug", tags=["debug"])

@debug_router.get("/promotions/{promotion_id}")
async def debug_promotion(promotion_id: int, db = Depends(get_database)):
    """Diagnóstico detallado de una promoción"""
    promo = await db.promotions.find_one({"id": promotion_id})
    
    if not promo:
        return {"error": "Promoción no encontrada"}
    
    today = date.today()
    
    # Parsear end_date
    end_date = None
    end_date_str = promo.get('end_date')
    if end_date_str:
        if isinstance(end_date_str, str):
            try:
                end_date = date.fromisoformat(end_date_str)
            except Exception as e:
                end_date = None
        else:
            end_date = end_date_str
    
    # Calcular remaining
    max_uses = promo.get('max_uses')
    current_uses = promo.get('current_uses', 0)
    remaining = None
    if max_uses is not None:
        remaining = max_uses - current_uses
    
    # Evaluar condiciones (NUEVA LÓGICA)
    low_time = end_date and end_date == today
    
    # max_uses: null significa usos ilimitados -> califica
    # max_uses: número -> solo si quedan menos de 5
    if max_uses is None:
        low_remaining = True  # usos ilimitados califican
    else:
        low_remaining = remaining < 5 and remaining > 0
    
    should_be_flash = low_time and low_remaining
    
    return {
        "promotion_id": promo.get('id'),
        "title": promo.get('title'),
        "business_id": promo.get('business_id'),
        "current_state": {
            "is_active": promo.get('is_active'),
            "is_flash_sale": promo.get('is_flash_sale'),
        },
        "dates": {
            "today": today.isoformat(),
            "start_date": promo.get('start_date'),
            "end_date": end_date_str,
            "end_date_parsed": end_date.isoformat() if end_date else None,
        },
        "codes": {
            "max_uses": max_uses,
            "current_uses": current_uses,
            "remaining": remaining,
        },
        "flash_sale_conditions": {
            "expires_today": low_time,
            "less_than_5_codes": low_remaining,
            "should_be_flash_sale": should_be_flash,
        },
        "diagnosis": {
            "is_expired": end_date < today if end_date else False,
            "should_be_deactivated": end_date < today if end_date else False,
            "current_flash_status": promo.get('is_flash_sale', False),
            "expected_flash_status": should_be_flash,
            "status_matches": promo.get('is_flash_sale', False) == should_be_flash,
        }
    }

@debug_router.get("/promotions")
async def debug_all_promotions(db = Depends(get_database)):
    """Diagnóstico de todas las promociones activas"""
    today = date.today()
    
    cursor = db.promotions.find({"is_active": True})
    promotions = await cursor.to_list(length=100)
    
    results = []
    for promo in promotions:
        # Parsear end_date
        end_date = None
        end_date_str = promo.get('end_date')
        if end_date_str:
            if isinstance(end_date_str, str):
                try:
                    end_date = date.fromisoformat(end_date_str)
                except:
                    pass
            else:
                end_date = end_date_str
        
        # Calcular remaining
        max_uses = promo.get('max_uses')
        current_uses = promo.get('current_uses', 0)
        remaining = None
        if max_uses is not None:
            remaining = max_uses - current_uses
        
        # Evaluar condiciones (NUEVA LÓGICA)
        low_time = end_date and end_date == today
        
        # max_uses: null significa usos ilimitados -> califica
        # max_uses: número -> solo si quedan menos de 5
        if max_uses is None:
            low_remaining = True  # usos ilimitados califican
        else:
            low_remaining = remaining < 5 and remaining > 0
        
        should_be_flash = low_time and low_remaining
        
        results.append({
            "id": promo.get('id'),
            "title": promo.get('title'),
            "is_flash_sale": promo.get('is_flash_sale'),
            "should_be_flash_sale": should_be_flash,
            "end_date": end_date.isoformat() if end_date else None,
            "expires_today": low_time,
            "remaining": remaining,
            "less_than_5": low_remaining,
            "status_ok": promo.get('is_flash_sale', False) == should_be_flash
        })
    
    return {
        "today": today.isoformat(),
        "total_active_promotions": len(results),
        "promotions": results
    }
