#!/bin/bash

# Script para configurar ngrok automáticamente y reiniciar el backend
# Uso: ./setup_webhook.sh

echo "🚀 Configurando webhook de MercadoPago con ngrok..."

# Verificar si ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok no está instalado"
    echo "Instálalo con: sudo snap install ngrok"
    echo "O descarga desde: https://ngrok.com/download"
    exit 1
fi

# Detener procesos existentes
echo "⏹️  Deteniendo procesos existentes..."
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "ngrok http" 2>/dev/null || true
sleep 2

# Iniciar ngrok en segundo plano
echo "🌐 Iniciando ngrok..."
ngrok http 8000 > /dev/null &
NGROK_PID=$!
sleep 3

# Obtener la URL de ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ No se pudo obtener la URL de ngrok"
    echo "Verifica que ngrok esté corriendo correctamente"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok URL: $NGROK_URL"

# Actualizar el .env
ENV_FILE="/home/facundo/Desktop/explorer-hub-fastapi/explorerhub/backend/.env"
if [ -f "$ENV_FILE" ]; then
    # Crear backup
    cp "$ENV_FILE" "$ENV_FILE.backup"
    
    # Actualizar la línea del webhook
    sed -i "s|MERCADOPAGO_WEBHOOK_URL=.*|MERCADOPAGO_WEBHOOK_URL=${NGROK_URL}/api/mercadopago/webhook|g" "$ENV_FILE"
    
    echo "✅ .env actualizado con la nueva URL de webhook"
else
    echo "❌ No se encontró el archivo .env en: $ENV_FILE"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

# Iniciar el backend
echo "🔧 Iniciando backend..."
cd /home/facundo/Desktop/explorer-hub-fastapi/explorerhub/backend

python3 -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --ssl-keyfile=/home/facundo/Desktop/explorer-hub-fastapi/explorerhub/key.pem \
    --ssl-certfile=/home/facundo/Desktop/explorer-hub-fastapi/explorerhub/cert.pem &

BACKEND_PID=$!
sleep 3

# Verificar que el webhook sea accesible
echo "🔍 Verificando webhook..."
WEBHOOK_RESPONSE=$(curl -s "${NGROK_URL}/api/mercadopago/webhook")

if [[ $WEBHOOK_RESPONSE == *'"status":"ok"'* ]]; then
    echo "✅ Webhook funcionando correctamente!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ CONFIGURACIÓN COMPLETADA ✨"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 URL del webhook: ${NGROK_URL}/api/mercadopago/webhook"
    echo "🖥️  ngrok PID: $NGROK_PID"
    echo "⚙️  Backend PID: $BACKEND_PID"
    echo ""
    echo "🎯 Próximos pasos:"
    echo "   1. El backend está corriendo con la nueva configuración"
    echo "   2. MercadoPago ahora puede enviar notificaciones al webhook"
    echo "   3. Realiza un pago de prueba para verificar"
    echo ""
    echo "📊 Para ver logs del webhook en tiempo real:"
    echo "   tail -f /home/facundo/Desktop/explorer-hub-fastapi/explorerhub/backend/logs/app.log"
    echo ""
    echo "⚠️  IMPORTANTE: Mantén esta terminal abierta"
    echo "   Si cierras esta terminal, ngrok se detendrá"
    echo ""
    echo "🛑 Para detener todo:"
    echo "   kill $NGROK_PID $BACKEND_PID"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ El webhook no responde correctamente"
    echo "Respuesta: $WEBHOOK_RESPONSE"
    kill $NGROK_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Mantener el script corriendo
wait
