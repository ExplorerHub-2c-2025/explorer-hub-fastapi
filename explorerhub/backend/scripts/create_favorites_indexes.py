"""
Script para crear índices en la colección de favoritos
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "explorerhub")


async def create_favorites_indexes():
    """Crear índices para la colección de favoritos"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("Creando índices para la colección 'favorites'...")
    
    # Índice compuesto para búsquedas rápidas por usuario y negocio
    await db.favorites.create_index([("user_id", 1), ("business_id", 1)], unique=True)
    print("✓ Índice creado: user_id + business_id (único)")
    
    # Índice para obtener todos los favoritos de un usuario
    await db.favorites.create_index([("user_id", 1), ("created_at", -1)])
    print("✓ Índice creado: user_id + created_at")
    
    # Índice para saber qué usuarios tienen un negocio como favorito
    await db.favorites.create_index([("business_id", 1)])
    print("✓ Índice creado: business_id")
    
    print("\n✅ Índices de favoritos creados exitosamente")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(create_favorites_indexes())
