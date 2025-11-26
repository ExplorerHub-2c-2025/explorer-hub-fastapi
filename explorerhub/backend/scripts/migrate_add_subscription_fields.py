"""
Script de migración para agregar campos de suscripción a negocios existentes
"""
import sys
import os

# Agregar el directorio padre al path para poder importar módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from database import get_database

async def migrate_subscription_fields():
    """Agregar campos de suscripción a todos los negocios existentes"""
    try:
        db = await anext(get_database())
        
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
        
        print(f"✅ Migración completada exitosamente")
        print(f"📊 Negocios actualizados: {result.modified_count}")
        print(f"📊 Negocios que coincidieron: {result.matched_count}")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Iniciando migración de campos de suscripción...")
    asyncio.run(migrate_subscription_fields())
    print("✨ Migración finalizada")
