import math
from typing import Any, Dict, Tuple

from fastapi import HTTPException, status
from mercadopago import SDK

from config import settings

BASE_PRICE = 1500
PLAN_MULTIPLIERS: Dict[str, int] = {
    "basic": 5,
    "premium": 10,
    "enterprise": 15,
}

DURATION_TO_MONTHS: Dict[int, int] = {
    30: 1,
    90: 3,
    180: 6,
    365: 12,
}


class MercadoPagoConfigurationError(HTTPException):
    def __init__(self, detail: str = "Configuración de Mercado Pago incompleta"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


def _get_client() -> SDK:
    access_token = settings.mercadopago_access_token
    if not access_token:
        raise MercadoPagoConfigurationError("Access Token de Mercado Pago no configurado")
    return SDK(access_token)


def calculate_subscription_amount(tier: str, duration_days: int) -> Tuple[int, int, int]:
    if tier not in PLAN_MULTIPLIERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tier inválido para la suscripción",
        )

    if duration_days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La duración debe ser un número positivo",
        )

    months = DURATION_TO_MONTHS.get(duration_days)
    if months is None:
        months = max(1, math.ceil(duration_days / 30))

    monthly_amount = PLAN_MULTIPLIERS[tier] * BASE_PRICE
    total_amount = monthly_amount * months
    return total_amount, months, monthly_amount


def create_subscription_preference_payload(
    *,
    business_id: int,
    business_name: str,
    tier: str,
    duration_days: int,
) -> Dict[str, Any]:
    total_amount, months, monthly_amount = calculate_subscription_amount(tier, duration_days)

    subscription_label = {
        "basic": "Básico",
        "premium": "Premium",
        "enterprise": "Enterprise",
    }.get(tier, tier.capitalize())

    description = (
        f"Suscripción {subscription_label} para {business_name} - "
        f"{months} mes(es) a ${monthly_amount:,}/mes".replace(",", ".")
    )

    success_url = (settings.mercadopago_success_url or "").strip()
    failure_url = (settings.mercadopago_failure_url or "").strip()
    pending_url = (settings.mercadopago_pending_url or "").strip()

    notification_url = settings.mercadopago_webhook_url
    if not notification_url:
        raise MercadoPagoConfigurationError("URL de webhook de Mercado Pago no configurada")

    payload: Dict[str, Any] = {
        "items": [
            {
                "title": description,
                "quantity": 1,
                "unit_price": float(total_amount),
                "currency_id": "ARS",
            }
        ],
        "notification_url": notification_url,
        "metadata": {
            "business_id": business_id,
            "tier": tier,
            "duration_days": duration_days,
            "months": months,
            "monthly_amount": monthly_amount,
            "total_amount": total_amount,
        },
    }

    back_urls: Dict[str, Any] = {}
    if success_url:
        back_urls["success"] = success_url
    if failure_url:
        back_urls["failure"] = failure_url
    if pending_url:
        back_urls["pending"] = pending_url

    if back_urls:
        payload["back_urls"] = back_urls

    if success_url.startswith("https://"):
        payload["auto_return"] = "approved"

    return payload


def create_preference(preference_payload: Dict[str, Any]) -> Dict[str, Any]:
    client = _get_client()
    response = client.preference().create(preference_payload)
    return response.get("response", {})


def get_payment(payment_id: str) -> Dict[str, Any]:
    client = _get_client()
    response = client.payment().get(payment_id)
    return response.get("response", {})

