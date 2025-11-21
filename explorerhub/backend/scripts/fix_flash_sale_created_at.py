"""
Script para actualizar el created_at de las ofertas flash con timestamp completo
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings


async def fix_flash_sale():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    # Actualizar la oferta flash con created_at timestamp completo
    result = await db.promotions.update_many(
        {"is_flash_sale": True},
        {
            "$set": {
                "created_at": datetime.now().isoformat()
            }
        }
    )
    
    print(f"✅ Ofertas flash actualizadas: {result.modified_count}")
    
    # Mostrar las ofertas flash
    flash_sales = await db.promotions.find({"is_flash_sale": True}).to_list(length=10)
    for promo in flash_sales:
        print(f"\n📦 ID: {promo['id']}")
        print(f"   Título: {promo['title']}")
        print(f"   created_at: {promo.get('created_at')}")
        print(f"   Duración: {promo.get('flash_duration_hours')} horas")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(fix_flash_sale())
