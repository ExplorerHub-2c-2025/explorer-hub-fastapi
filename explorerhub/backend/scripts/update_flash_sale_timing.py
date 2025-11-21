"""
Script para actualizar las ofertas flash para que aparezcan solo cuando falten menos de 24h
"""
import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def update_flash_sales():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    db = client.explorerhub
    
    # Encontrar todas las promociones flash
    flash_sales = await db.promotions.find({"is_flash_sale": True}).to_list(length=100)
    
    print(f"\n📊 Encontradas {len(flash_sales)} ofertas flash")
    
    for promo in flash_sales:
        promo_id = promo.get("id")
        title = promo.get("title")
        flash_duration_hours = promo.get("flash_duration_hours", 6)
        
        # Configurar created_at para que la oferta esté activa ahora
        # y termine en el número de horas especificado
        now = datetime.now()
        
        # La oferta comenzó hace menos de 24 horas para que sea visible
        # Por ejemplo, si dura 6 horas, la iniciamos hace 2 horas
        hours_ago = min(2, flash_duration_hours - 1)
        created_at = now - timedelta(hours=hours_ago)
        end_time = created_at + timedelta(hours=flash_duration_hours)
        
        time_remaining = end_time - now
        hours_left = time_remaining.total_seconds() / 3600
        
        print(f"\n🔥 Promoción: {title} (ID: {promo_id})")
        print(f"   Duración total: {flash_duration_hours} horas")
        print(f"   Comenzó: {created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   Termina: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   ⏰ Tiempo restante: {hours_left:.2f} horas")
        
        # Actualizar en la base de datos
        await db.promotions.update_one(
            {"id": promo_id},
            {
                "$set": {
                    "created_at": created_at.isoformat(),
                    "start_date": created_at.date().isoformat(),
                    "end_date": (created_at + timedelta(days=7)).date().isoformat()
                }
            }
        )
        
        print(f"   ✅ Actualizado correctamente")
    
    print(f"\n✨ Todas las ofertas flash han sido actualizadas!")
    print(f"🎯 Ahora solo aparecerán cuando falten menos de 24 horas para terminar")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_flash_sales())
