import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from auth import get_current_active_user
from database import get_database
from models.user import UserInDB
from services.mercadopago_service import (
    create_preference,
    create_subscription_preference_payload,
    get_payment,
)
from services.subscription_service import apply_subscription_update

logger = logging.getLogger("mercadopago")

router = APIRouter(prefix="/api/mercadopago", tags=["mercadopago"])


class SubscriptionPreferenceRequest(BaseModel):
    business_id: int
    tier: str
    duration_days: int


@router.post("/preferences/subscription")
async def create_subscription_preference_endpoint(
    request_data: SubscriptionPreferenceRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_database),
):
    business = await db.businesses.find_one({"id": request_data.business_id})
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    if business.get("owner_id") != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el dueño del negocio puede crear la preferencia de pago",
        )

    payload = create_subscription_preference_payload(
        business_id=request_data.business_id,
        business_name=business.get("name", "Negocio ExplorerHub"),
        tier=request_data.tier,
        duration_days=request_data.duration_days,
    )

    preference_response = await run_in_threadpool(create_preference, payload)

    if not preference_response:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo crear la preferencia de Mercado Pago",
        )

    init_point = preference_response.get("init_point") or preference_response.get("sandbox_init_point")
    if not init_point:
        logger.error("Preferencia sin init_point: %s", preference_response)
        detail = preference_response.get("message") or preference_response.get("error") or "Mercado Pago no devolvió init_point"
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(detail),
        )

    return {
        "preference_id": preference_response.get("id"),
        "init_point": init_point,
        "sandbox_init_point": preference_response.get("sandbox_init_point"),
        "payload": payload,
    }


@router.post("/webhook")
async def mercadopago_webhook(
    request: Request,
    db=Depends(get_database),
):
    params = dict(request.query_params)
    topic = params.get("topic")

    try:
        body = await request.json()
    except Exception:
        body = {}

    logger.info("=== WEBHOOK RECIBIDO ===")
    logger.info(f"Topic: {topic}")
    logger.info(f"Params: {params}")
    logger.info(f"Body: {body}")

    if not topic:
        topic = body.get("type")

    if topic not in {"payment", "merchant_order", None}:
        logger.info("Notificación ignorada por topic no soportado: %s", topic)
        return {"status": "ignored"}

    payment_id = params.get("id") or body.get("data", {}).get("id") or body.get("id")
    if not payment_id:
        logger.warning("Notificación sin payment_id: params=%s, body=%s", params, body)
        return {"status": "ignored"}

    logger.info(f"Consultando pago {payment_id} a Mercado Pago...")
    payment = await run_in_threadpool(get_payment, str(payment_id))
    if not payment:
        logger.error("Mercado Pago no devolvió información del pago %s", payment_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo obtener la información del pago de Mercado Pago",
        )

    logger.info("Pago %s recibido con estado %s", payment.get("id"), payment.get("status"))
    logger.info(f"Información completa del pago: {payment}")

    if payment.get("status") != "approved":
        logger.info(f"Pago ignorado por estado: {payment.get('status')}")
        return {"status": "ignored", "detail": f"Estado {payment.get('status')}"}

    metadata = payment.get("metadata") or {}
    logger.info(f"Metadata del pago: {metadata}")
    
    try:
        business_id = int(metadata.get("business_id"))
        duration_days = int(metadata.get("duration_days"))
        tier = metadata.get("tier")
    except (TypeError, ValueError) as e:
        logger.error("Metadata inválida en pago %s: %s - Error: %s", payment.get("id"), metadata, str(e))
        return {"status": "ignored", "detail": "Metadata inválida"}

    if not all([business_id, duration_days, tier]):
        logger.error("Metadata incompleta en pago %s: %s", payment.get("id"), metadata)
        return {"status": "ignored", "detail": "Metadata incompleta"}

    logger.info(f"Aplicando suscripción: business_id={business_id}, tier={tier}, duration_days={duration_days}")
    
    await apply_subscription_update(
        db,
        business_id=business_id,
        tier=tier,
        duration_days=duration_days,
    )

    logger.info(f"✅ Suscripción aplicada exitosamente para business_id={business_id}")
    return {"status": "processed"}


@router.get("/webhook")
async def mercadopago_webhook_verify():
    return {"status": "ok"}


@router.post("/test-subscription-update")
async def test_subscription_update(
    business_id: int,
    tier: str,
    duration_days: int,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_database),
):
    """
    Endpoint de prueba para aplicar manualmente una suscripción sin pasar por MercadoPago.
    Solo para testing/debugging.
    """
    logger.info(f"TEST: Aplicando suscripción manual - business_id={business_id}, tier={tier}, duration_days={duration_days}")
    
    result = await apply_subscription_update(
        db,
        business_id=business_id,
        tier=tier,
        duration_days=duration_days,
    )
    
    return {
        "status": "success",
        "message": "Suscripción aplicada manualmente",
        "business": {
            "id": result.id,
            "name": result.name,
            "is_subscribed": result.is_subscribed,
            "subscription_tier": result.subscription_tier,
            "subscription_ends_at": result.subscription_ends_at,
        }
    }


class ProcessPaymentRequest(BaseModel):
    payment_id: str = None
    preference_id: str = None


@router.post("/process-payment")
async def process_payment_manually(
    request_data: ProcessPaymentRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_database),
):
    """
    Endpoint para procesar manualmente un pago exitoso cuando el webhook no puede ser alcanzado.
    Se llama desde el frontend después de que MercadoPago redirige con payment_success=true.
    """
    payment_id = request_data.payment_id
    
    if not payment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere payment_id para procesar el pago",
        )
    
    logger.info(f"MANUAL: Procesando pago {payment_id} manualmente desde el frontend")
    
    # Obtener información del pago de MercadoPago
    payment = await run_in_threadpool(get_payment, str(payment_id))
    if not payment:
        logger.error("Mercado Pago no devolvió información del pago %s", payment_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo obtener la información del pago de Mercado Pago",
        )

    logger.info("Pago %s con estado %s", payment.get("id"), payment.get("status"))
    logger.info(f"Información completa del pago: {payment}")

    if payment.get("status") != "approved":
        logger.warning(f"Pago no aprobado, estado: {payment.get('status')}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El pago no está aprobado. Estado: {payment.get('status')}",
        )

    # Extraer metadata
    metadata = payment.get("metadata") or {}
    logger.info(f"Metadata del pago: {metadata}")
    
    try:
        business_id = int(metadata.get("business_id"))
        duration_days = int(metadata.get("duration_days"))
        tier = metadata.get("tier")
    except (TypeError, ValueError) as e:
        logger.error("Metadata inválida en pago %s: %s - Error: %s", payment.get("id"), metadata, str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Metadata del pago inválida o incompleta",
        )

    if not all([business_id, duration_days, tier]):
        logger.error("Metadata incompleta en pago %s: %s", payment.get("id"), metadata)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Metadata del pago incompleta",
        )

    # Verificar que el usuario actual sea el dueño del negocio
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado",
        )
    
    if business.get("owner_id") != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar este negocio",
        )

    logger.info(f"Aplicando suscripción: business_id={business_id}, tier={tier}, duration_days={duration_days}")
    
    # Aplicar la suscripción
    result = await apply_subscription_update(
        db,
        business_id=business_id,
        tier=tier,
        duration_days=duration_days,
    )

    logger.info(f"✅ Suscripción aplicada exitosamente para business_id={business_id}")
    
    return {
        "status": "success",
        "message": "Pago procesado y suscripción aplicada",
        "payment_id": payment_id,
        "business": {
            "id": result.id,
            "name": result.name,
            "is_subscribed": result.is_subscribed,
            "subscription_tier": result.subscription_tier,
            "subscription_ends_at": result.subscription_ends_at,
        }
    }


