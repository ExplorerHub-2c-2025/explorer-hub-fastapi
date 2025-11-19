"""
Script para crear una oferta flash de prueba
Ejecutar con: python scripts/create_test_flash_sale.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import date, timedelta
import sys
import os

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

# Colores para terminal
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'


async def create_flash_sale():
    """
    Convierte la primera promoción activa en una oferta flash de prueba
    """
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}⚡ CREAR OFERTA FLASH DE PRUEBA{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.mongodb_url)
        db = client[settings.database_name]
        promotions_collection = db.promotions
        businesses_collection = db.businesses

        # Buscar una promoción activa que no sea flash
        promotion = await promotions_collection.find_one({
            "is_active": True,
            "$or": [
                {"is_flash_sale": False},
                {"is_flash_sale": {"$exists": False}}
            ]
        })

        if not promotion:
            print(f"{Colors.YELLOW}⚠️  No se encontró ninguna promoción activa para convertir{Colors.END}")
            print(f"{Colors.BLUE}💡 Creando una nueva oferta flash...{Colors.END}\n")
            
            # Buscar un negocio activo
            business = await businesses_collection.find_one({"estado": True})
            
            if not business:
                print(f"{Colors.RED}❌ No hay negocios activos en la base de datos{Colors.END}")
                return
            
            # Crear nueva promoción flash
            today = date.today()
            new_promo = {
                "id": await get_next_promotion_id(promotions_collection),
                "business_id": business["id"],
                "title": "⚡ Oferta Flash - Descuento Especial",
                "description": "¡Aprovecha esta oferta por tiempo limitado! Descuento exclusivo.",
                "discount_percentage": 30,
                "promotion_type": "automatic",
                "is_active": True,
                "is_flash_sale": True,
                "flash_duration_hours": 6,
                "start_date": today.isoformat(),
                "end_date": (today + timedelta(days=7)).isoformat(),
                "max_uses": 20,
                "current_uses": 5,  # Simular que ya se usaron 5
                "min_purchase": None,
                "applies_to_ticket_types": ["adult", "senior", "child"],
                "created_at": today.isoformat()
            }
            
            await promotions_collection.insert_one(new_promo)
            
            print(f"{Colors.GREEN}✅ Oferta flash creada exitosamente{Colors.END}")
            print(f"{Colors.BLUE}   ID: {new_promo['id']}{Colors.END}")
            print(f"{Colors.BLUE}   Negocio: {business['name']}{Colors.END}")
            print(f"{Colors.BLUE}   Título: {new_promo['title']}{Colors.END}")
            print(f"{Colors.BLUE}   Descuento: {new_promo['discount_percentage']}%{Colors.END}")
            print(f"{Colors.BLUE}   Duración: {new_promo['flash_duration_hours']} horas{Colors.END}")
            print(f"{Colors.BLUE}   Stock: {new_promo['max_uses'] - new_promo['current_uses']}/{new_promo['max_uses']}{Colors.END}\n")
            
        else:
            # Actualizar promoción existente
            business = await businesses_collection.find_one({"id": promotion["business_id"]})
            
            today = date.today()
            result = await promotions_collection.update_one(
                {"_id": promotion["_id"]},
                {
                    "$set": {
                        "is_flash_sale": True,
                        "flash_duration_hours": 6,
                        "start_date": today.isoformat(),
                        "end_date": (today + timedelta(days=7)).isoformat(),
                        "max_uses": 20,
                        "current_uses": 5  # Simular que ya se usaron 5
                    }
                }
            )

            print(f"{Colors.GREEN}✅ Promoción convertida a oferta flash{Colors.END}")
            print(f"{Colors.BLUE}   ID: {promotion['id']}{Colors.END}")
            print(f"{Colors.BLUE}   Negocio: {business['name'] if business else 'N/A'}{Colors.END}")
            print(f"{Colors.BLUE}   Título: {promotion['title']}{Colors.END}")
            print(f"{Colors.BLUE}   Duración: 6 horas{Colors.END}")
            print(f"{Colors.BLUE}   Stock: 15/20 disponibles{Colors.END}\n")

        print(f"{Colors.GREEN}{Colors.BOLD}✅ Ahora puedes ver la oferta flash en /explore{Colors.END}\n")

    except Exception as e:
        print(f"\n{Colors.RED}❌ Error: {e}{Colors.END}\n")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


async def get_next_promotion_id(collection):
    """Obtiene el siguiente ID disponible para una promoción"""
    last_promo = await collection.find_one(sort=[("id", -1)])
    return (last_promo["id"] + 1) if last_promo else 1


if __name__ == "__main__":
    asyncio.run(create_flash_sale())
