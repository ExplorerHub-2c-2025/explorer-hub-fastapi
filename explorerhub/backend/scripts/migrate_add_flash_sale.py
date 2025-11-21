"""
Script de migración para agregar campos de ofertas relámpago a promociones existentes
Ejecutar con: python scripts/migrate_add_flash_sale.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
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


async def migrate_add_flash_sale_fields():
    """
    Agrega los campos is_flash_sale y flash_duration_hours a todas las promociones
    que no los tengan.
    """
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}🔄 MIGRACIÓN: Agregar campos de ofertas relámpago{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.mongodb_url)
        db = client[settings.database_name]
        promotions_collection = db.promotions

        print(f"{Colors.YELLOW}📊 Analizando promociones existentes...{Colors.END}\n")

        # Contar promociones que no tienen el campo
        count_without_flash = await promotions_collection.count_documents({
            "is_flash_sale": {"$exists": False}
        })

        if count_without_flash == 0:
            print(f"{Colors.GREEN}✅ Todas las promociones ya tienen los campos de ofertas relámpago{Colors.END}")
            return

        print(f"{Colors.BLUE}📝 Promociones sin campos de ofertas relámpago: {count_without_flash}{Colors.END}\n")

        # Actualizar promociones que no tienen el campo
        result = await promotions_collection.update_many(
            {"is_flash_sale": {"$exists": False}},
            {
                "$set": {
                    "is_flash_sale": False,
                    "flash_duration_hours": None
                }
            }
        )

        print(f"{Colors.GREEN}✅ Promociones actualizadas: {result.modified_count}{Colors.END}")
        print(f"{Colors.GREEN}   • is_flash_sale: False (default){Colors.END}")
        print(f"{Colors.GREEN}   • flash_duration_hours: None{Colors.END}\n")

        # Verificar el resultado
        total_promotions = await promotions_collection.count_documents({})
        promotions_with_flash = await promotions_collection.count_documents({
            "is_flash_sale": {"$exists": True}
        })

        print(f"{Colors.BOLD}📊 Resumen Final:{Colors.END}")
        print(f"   Total de promociones: {total_promotions}")
        print(f"   Con campos de ofertas relámpago: {promotions_with_flash}")
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ Migración completada exitosamente{Colors.END}\n")

    except Exception as e:
        print(f"\n{Colors.RED}❌ Error durante la migración: {e}{Colors.END}\n")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


async def main():
    """Función principal"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}🔄 MIGRACIÓN DE BASE DE DATOS{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

    print(f"{Colors.YELLOW}🎯 Esta migración agregará los siguientes campos:{Colors.END}")
    print(f"   • is_flash_sale (boolean): Indica si es oferta relámpago")
    print(f"   • flash_duration_hours (int|null): Duración en horas\n")

    print(f"{Colors.YELLOW}⚠️  Valores por defecto para promociones existentes:{Colors.END}")
    print(f"   • is_flash_sale: False")
    print(f"   • flash_duration_hours: None\n")

    response = input(f"{Colors.BOLD}¿Deseas continuar? (s/n): {Colors.END}").strip().lower()

    if response != 's':
        print(f"\n{Colors.YELLOW}❌ Migración cancelada{Colors.END}\n")
        return

    print()
    await migrate_add_flash_sale_fields()


if __name__ == "__main__":
    asyncio.run(main())
