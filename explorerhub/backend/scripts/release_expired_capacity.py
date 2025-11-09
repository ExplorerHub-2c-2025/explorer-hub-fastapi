#!/usr/bin/env python3
"""
Script para liberar cupos de reservas expiradas
Se ejecuta periódicamente para liberar automáticamente los cupos
de reservas que ya pasaron su fecha/hora
"""

import asyncio
import sys
import os

# Agregar el directorio backend al path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from utils import release_expired_capacity_slots
from database import get_database


async def main():
    """Liberar cupos expirados"""
    print("Iniciando liberación de cupos expirados...")

    try:
        # Conectar a la base de datos
        from database import Database
        await Database.connect_db()
        db = Database.get_db()
        
        released_count = await release_expired_capacity_slots(db)
        print(f"Proceso completado. Se liberaron cupos de {released_count} reservas expiradas.")
    except Exception as e:
        print(f"Error al liberar cupos: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
