# ExplorerHub Backend

Python FastAPI backend for the ExplorerHub travel and tourism platform.

## Setup

1. Start up the environment:
```bash
cd explorerhub/backend/
python3 -m venv .venv
source .venv/bin/activate
```
1. Install dependencies:
```bash

pip install -r requirements.txt
```

2. Run the development server:
```bash
uvicorn main:app --reload --port 8000

uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --ssl-keyfile=/home/facundo/Desktop/explorer-hub-fastapi/explorerhub/key.pem \
  --ssl-certfile=/home/facundo/Desktop/explorer-hub-fastapi/explorerhub/cert.pem

```

## API Documentation

Once running, visit:
- Swagger UI: https://localhost:8000/docs
- ReDoc: https://localhost:8000/redoc

## Environment Variables

Create a `.env` file with:
```
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key
MERCADOPAGO_PUBLIC_KEY=APP_USR-7b6ec507-5e13-474b-b533-b26ef6a33a27
MERCADOPAGO_ACCESS_TOKEN=APP_USR-2869396951625997-120121-d5cc173fb6fa03ceb6249290e0ab12f9-2942643473
MERCADOPAGO_WEBHOOK_URL=https://localhost:8000/api/mercadopago/webhook
MERCADOPAGO_SUCCESS_URL=http://localhost:3000/checkout/success
MERCADOPAGO_FAILURE_URL=http://localhost:3000/checkout/failure
MERCADOPAGO_PENDING_URL=http://localhost:3000/checkout/pending
```

Usa las credenciales provistas arriba (modo prueba) o reemplázalas por las de tu cuenta de Mercado Pago cuando pases a producción.

## Automated Capacity Management

The system includes an automated capacity management system that:

- **Automatically releases expired bookings** every hour
- **Sends notifications** to users when capacity slots become available
- **Provides real-time capacity monitoring** in the business dashboard

### Setup Automated Capacity Release

The capacity scheduler runs automatically every hour via systemd:

1. The scheduler is configured as a systemd service and timer
2. It runs `scripts/capacity_scheduler.py` which releases expired bookings
3. Notifications are sent to users waiting for capacity slots
4. Business owners can monitor capacity usage in their dashboard

### Manual Capacity Release

You can also run capacity release manually:
```bash
cd explorerhub/backend/
python3 scripts/release_expired_capacity.py
```

### Testing the Scheduler

To test the automated scheduler:
```bash
cd explorerhub/backend/
python3 scripts/capacity_scheduler.py
```