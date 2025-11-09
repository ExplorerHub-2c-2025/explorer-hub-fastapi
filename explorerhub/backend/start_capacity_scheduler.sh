#!/bin/bash
# Script de inicio para el scheduler de liberación de cupos
# Este script puede ser usado con cron o systemd

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activar el entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Ejecutar el scheduler
echo "$(date): Iniciando scheduler de liberación de cupos..."
python3 scripts/capacity_scheduler.py

echo "$(date): Scheduler finalizado."
