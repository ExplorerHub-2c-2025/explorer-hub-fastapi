#!/usr/bin/env python3
"""
Scheduler para liberar cupos expirados automáticamente cada hora
"""
import asyncio
import os
import sys
import time
from datetime import datetime

# Agregar el directorio backend al path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from database import Database
from utils import release_expired_capacity_slots
from routes.notifications import notify_capacity_released


async def run_capacity_release():
    """Ejecuta la liberación de cupos y notifica si se liberaron cupos"""
    print(f"[{datetime.utcnow()}] Iniciando liberación automática de cupos...")

    try:
        # Conectar a la base de datos
        await Database.connect_db()
        db = Database.get_db()

        # Liberar cupos expirados
        released_count = await release_expired_capacity_slots(db)

        if released_count > 0:
            print(f"[{datetime.utcnow()}] Se liberaron cupos de {released_count} reservas expiradas")

            # Notificar sobre liberación de cupos
            await notify_capacity_released(released_count, db)
        else:
            print(f"[{datetime.utcnow()}] No hay cupos para liberar")

    except Exception as e:
        print(f"[{datetime.utcnow()}] Error en liberación automática: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cerrar conexión
        await Database.close_db()


async def scheduler():
    """Scheduler que ejecuta la liberación cada hora"""
    print("Iniciando scheduler de liberación de cupos (cada hora)...")

    while True:
        try:
            await run_capacity_release()
        except Exception as e:
            print(f"Error en scheduler: {e}")

        # Esperar 1 hora (3600 segundos)
        print(f"[{datetime.utcnow()}] Esperando 1 hora hasta la próxima liberación...")
        await asyncio.sleep(3600)


if __name__ == "__main__":
    # Ejecutar inmediatamente y luego cada hora
    asyncio.run(run_capacity_release())

    # Iniciar scheduler continuo
    asyncio.run(scheduler())
