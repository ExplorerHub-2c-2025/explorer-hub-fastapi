#!/bin/bash
# Script para iniciar ngrok y exponer el backend FastAPI con HTTPS

echo "🚀 Iniciando ngrok para exponer puerto 8000 con HTTPS..."
echo "⚠️  IMPORTANTE: Copia la URL HTTPS que aparece y actualiza tu .env"
echo "   - MERCADOPAGO_WEBHOOK_URL=https://tu-url.ngrok.io/api/mercadopago/webhook"
echo ""

ngrok http 8000
