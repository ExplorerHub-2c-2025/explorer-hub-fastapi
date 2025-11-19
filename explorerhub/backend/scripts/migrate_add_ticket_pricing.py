"""
Script de migración para agregar ticket_pricing a negocios existentes
Este script agrega el campo ticket_pricing a todos los negocios que no lo tengan
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import settings
from motor.motor_asyncio import AsyncIOMotorClient


async def migrate_add_ticket_pricing():
    """
    Agrega el campo ticket_pricing a todos los negocios que no lo tengan.
    """
    print("🚀 Iniciando migración: Agregar ticket_pricing a negocios")
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.mongodb_url)
        db = client[settings.database_name]
        
        # Obtener todos los negocios
        businesses_collection = db.businesses
        total = await businesses_collection.count_documents({})
        print(f"📊 Total de negocios: {total}")
        
        # Contar negocios sin ticket_pricing
        without_pricing = await businesses_collection.count_documents({
            "ticket_pricing": {"$exists": False}
        })
        print(f"📝 Negocios sin ticket_pricing: {without_pricing}")
        
        if without_pricing == 0:
            print("✅ Todos los negocios ya tienen ticket_pricing")
            return
        
        # Actualizar negocios sin ticket_pricing
        result = await businesses_collection.update_many(
            {"ticket_pricing": {"$exists": False}},
            {"$set": {"ticket_pricing": None}}
        )
        
        print(f"✅ Actualizados: {result.modified_count} negocios")
        print(f"✨ Migración completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        raise
    finally:
        if client:
            client.close()


async def migrate_add_promotion_type():
    """Agregar promotion_type a promociones existentes"""
    print("\n🚀 Iniciando migración: Agregar promotion_type a promociones")
    
    db = None
    client = None
    
    try:
        # Conectar a la base de datos
        client = AsyncIOMotorClient(settings.mongodb_url)
        db = client[settings.database_name]
        
        # Obtener todas las promociones
        promotions_collection = db.promotions
        total = await promotions_collection.count_documents({})
        print(f"📊 Total de promociones: {total}")
        
        # Contar promociones sin promotion_type
        without_type = await promotions_collection.count_documents({
            "promotion_type": {"$exists": False}
        })
        print(f"📝 Promociones sin promotion_type: {without_type}")
        
        if without_type == 0:
            print("✅ Todas las promociones ya tienen promotion_type")
            return
        
        # Actualizar promociones sin promotion_type
        # Si tienen código, son de tipo "code", si no, son "automatic"
        result_with_code = await promotions_collection.update_many(
            {
                "promotion_type": {"$exists": False},
                "code": {"$exists": True, "$ne": None, "$ne": ""}
            },
            {"$set": {"promotion_type": "code"}}
        )
        
        result_without_code = await promotions_collection.update_many(
            {
                "promotion_type": {"$exists": False},
                "$or": [
                    {"code": {"$exists": False}},
                    {"code": None},
                    {"code": ""}
                ]
            },
            {"$set": {"promotion_type": "automatic"}}
        )
        
        total_modified = result_with_code.modified_count + result_without_code.modified_count
        print(f"✅ Actualizadas: {total_modified} promociones")
        print(f"   - {result_with_code.modified_count} como 'code'")
        print(f"   - {result_without_code.modified_count} como 'automatic'")
        print(f"✨ Migración completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        raise
    finally:
        if client:
            client.close()


async def main():
    """Ejecutar todas las migraciones"""
    print("=" * 60)
    print("🔄 MIGRACIÓN DE BASE DE DATOS")
    print("=" * 60)
    
    await migrate_add_ticket_pricing()
    await migrate_add_promotion_type()
    
    print("\n" + "=" * 60)
    print("🎉 TODAS LAS MIGRACIONES COMPLETADAS")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
