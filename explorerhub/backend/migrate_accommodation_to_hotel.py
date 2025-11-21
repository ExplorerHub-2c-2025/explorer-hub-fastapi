"""
Script para migrar todas las categorías "Accommodation" y "Alojamiento" a "Hotel"
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def migrate_to_hotel():
    """Migra todas las categorías Accommodation/Alojamiento a Hotel"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    businesses_collection = db.businesses
    
    print("🔍 Buscando negocios con categoría 'Accommodation' o 'Alojamiento'...")
    
    # Buscar todos los negocios con estas categorías
    query = {
        "$or": [
            {"categories": "Accommodation"},
            {"categories": "Alojamiento"}
        ]
    }
    
    cursor = businesses_collection.find(query)
    businesses = await cursor.to_list(length=None)
    
    print(f"📊 Encontrados {len(businesses)} negocios para migrar")
    
    if len(businesses) == 0:
        print("✅ No hay negocios para migrar")
        client.close()
        return
    
    updated_count = 0
    
    for business in businesses:
        business_id = business.get("id")
        business_name = business.get("name")
        old_categories = business.get("categories", [])
        
        # Crear nuevas categorías reemplazando Accommodation y Alojamiento por Hotel
        new_categories = []
        for cat in old_categories:
            if cat in ["Accommodation", "Alojamiento"]:
                if "Hotel" not in new_categories:
                    new_categories.append("Hotel")
            else:
                new_categories.append(cat)
        
        # Actualizar en la base de datos
        result = await businesses_collection.update_one(
            {"id": business_id},
            {"$set": {"categories": new_categories}}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✅ Actualizado: {business_name}")
            print(f"   Antes: {old_categories}")
            print(f"   Después: {new_categories}")
        else:
            print(f"⚠️  No se pudo actualizar: {business_name}")
    
    print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"✅ MIGRACIÓN COMPLETADA")
    print(f"📊 Total de negocios actualizados: {updated_count}/{len(businesses)}")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_to_hotel())
