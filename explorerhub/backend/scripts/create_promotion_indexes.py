"""
Script para crear índices en MongoDB para el sistema de promociones
Esto mejora el rendimiento de las consultas
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "explorerhub")


async def create_promotion_indexes():
    """Crear índices para la colección de promociones"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("Conectando a MongoDB...")
    print(f"URL: {MONGODB_URL}")
    print(f"Database: {DATABASE_NAME}")
    
    try:
        # Crear índices para la colección de promociones
        print("\nCreando índices para 'promotions'...")
        
        # Índice para buscar por business_id
        await db.promotions.create_index("business_id")
        print("✓ Índice creado: business_id")
        
        # Índice para buscar por business_id y is_active
        await db.promotions.create_index([
            ("business_id", 1),
            ("is_active", 1)
        ])
        print("✓ Índice creado: business_id + is_active")
        
        # Índice para buscar por fecha de fin (para verificar expiración)
        await db.promotions.create_index("end_date")
        print("✓ Índice creado: end_date")
        
        # Índice compuesto para búsquedas eficientes de promociones activas
        await db.promotions.create_index([
            ("business_id", 1),
            ("is_active", 1),
            ("end_date", 1)
        ])
        print("✓ Índice creado: business_id + is_active + end_date")
        
        # Índice único para el ID secuencial
        await db.promotions.create_index("id", unique=True)
        print("✓ Índice único creado: id")
        
        # Crear índices para la colección de claims
        print("\nCreando índices para 'promotion_claims'...")
        
        # Índice para buscar por user_id
        await db.promotion_claims.create_index("user_id")
        print("✓ Índice creado: user_id")
        
        # Índice para buscar por promotion_id
        await db.promotion_claims.create_index("promotion_id")
        print("✓ Índice creado: promotion_id")
        
        # Índice único compuesto para evitar claims duplicados
        await db.promotion_claims.create_index([
            ("user_id", 1),
            ("promotion_id", 1)
        ], unique=True)
        print("✓ Índice único creado: user_id + promotion_id")
        
        # Índice único para el ID secuencial
        await db.promotion_claims.create_index("id", unique=True)
        print("✓ Índice único creado: id")
        
        # Listar todos los índices creados
        print("\n" + "="*50)
        print("ÍNDICES DE PROMOTIONS:")
        print("="*50)
        indexes = await db.promotions.index_information()
        for name, info in indexes.items():
            print(f"- {name}: {info.get('key', [])}")
        
        print("\n" + "="*50)
        print("ÍNDICES DE PROMOTION_CLAIMS:")
        print("="*50)
        indexes = await db.promotion_claims.index_information()
        for name, info in indexes.items():
            print(f"- {name}: {info.get('key', [])}")
        
        print("\n✅ Todos los índices creados exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error al crear índices: {e}")
    finally:
        client.close()
        print("\nConexión cerrada.")


if __name__ == "__main__":
    print("="*50)
    print("CREACIÓN DE ÍNDICES PARA PROMOCIONES")
    print("="*50)
    asyncio.run(create_promotion_indexes())
