"""
Sistema de cálculo de precios flexible para diferentes tipos de negocios
"""
from typing import Dict, Optional, Any


def calculate_ticket_price(ticket_pricing: Dict, ticket_selection: Dict) -> Dict[str, Any]:
    """
    Calcula precio para entradas (museos, atracciones, parques)
    """
    original_price = 0.0
    breakdown = {}
    
    adult_count = ticket_selection.get("adult_count", 0)
    senior_count = ticket_selection.get("senior_count", 0)
    child_count = ticket_selection.get("child_count", 0)
    
    if ticket_pricing.get("adult_price") and adult_count > 0:
        subtotal = ticket_pricing["adult_price"] * adult_count
        original_price += subtotal
        breakdown["adult"] = {
            "count": adult_count,
            "price_per_ticket": ticket_pricing["adult_price"],
            "subtotal": subtotal
        }
    
    if ticket_pricing.get("senior_price") and senior_count > 0:
        subtotal = ticket_pricing["senior_price"] * senior_count
        original_price += subtotal
        breakdown["senior"] = {
            "count": senior_count,
            "price_per_ticket": ticket_pricing["senior_price"],
            "subtotal": subtotal
        }
    
    if ticket_pricing.get("child_price") and child_count > 0:
        subtotal = ticket_pricing["child_price"] * child_count
        original_price += subtotal
        breakdown["child"] = {
            "count": child_count,
            "price_per_ticket": ticket_pricing["child_price"],
            "subtotal": subtotal
        }
    
    return {
        "original_price": original_price,
        "breakdown": breakdown,
        "pricing_type": "ticket"
    }


def calculate_hotel_price(hotel_pricing: Dict, booking_details: Dict) -> Dict[str, Any]:
    """
    Calcula precio para alojamiento (hoteles, hostels, cabañas)
    """
    nights = booking_details.get("nights", 1)
    price_per_night = hotel_pricing.get("price_per_night", 0)
    min_nights = hotel_pricing.get("min_nights", 1)
    max_nights = hotel_pricing.get("max_nights")
    
    # Validaciones
    errors = []
    if nights < min_nights:
        errors.append(f"Mínimo de noches requerido: {min_nights}")
    if max_nights and nights > max_nights:
        errors.append(f"Máximo de noches permitido: {max_nights}")
    
    if errors:
        return {
            "original_price": 0,
            "breakdown": {},
            "errors": errors,
            "pricing_type": "hotel"
        }
    
    original_price = price_per_night * nights
    
    return {
        "original_price": original_price,
        "breakdown": {
            "nights": nights,
            "price_per_night": price_per_night,
            "total": original_price
        },
        "pricing_type": "hotel"
    }


def calculate_restaurant_price(restaurant_pricing: Dict, booking_details: Dict) -> Dict[str, Any]:
    """
    Calcula precio para restaurantes (cargo de reserva + estimación)
    """
    people = booking_details.get("people", 1)
    reservation_fee = restaurant_pricing.get("reservation_fee", 0)
    average_price_per_person = restaurant_pricing.get("average_price_per_person", 0)
    min_consumption = restaurant_pricing.get("min_consumption")
    
    # Cargo de reserva
    original_price = reservation_fee
    
    # Estimación del consumo
    estimated_consumption = average_price_per_person * people if average_price_per_person else 0
    
    warnings = []
    if min_consumption and (estimated_consumption + reservation_fee) < min_consumption:
        warnings.append(f"Consumo mínimo requerido: ${min_consumption}")
    
    return {
        "original_price": original_price,  # Solo el cargo de reserva se cobra por adelantado
        "breakdown": {
            "reservation_fee": reservation_fee,
            "people": people,
            "estimated_consumption": estimated_consumption,
            "estimated_total": reservation_fee + estimated_consumption
        },
        "warnings": warnings,
        "pricing_type": "restaurant"
    }


def calculate_activity_price(activity_pricing: Dict, booking_details: Dict) -> Dict[str, Any]:
    """
    Calcula precio para actividades (tours, excursiones) con descuentos grupales
    """
    people = booking_details.get("people", 1)
    base_price = activity_pricing.get("base_price", 0)
    group_discount_threshold = activity_pricing.get("group_discount_threshold")
    group_discount_percentage = activity_pricing.get("group_discount_percentage")
    
    subtotal = base_price * people
    discount = 0
    discount_applied = False
    
    # Aplicar descuento grupal si aplica
    if (group_discount_threshold and group_discount_percentage and 
        people >= group_discount_threshold):
        discount = subtotal * (group_discount_percentage / 100)
        discount_applied = True
    
    original_price = subtotal - discount
    
    return {
        "original_price": original_price,
        "breakdown": {
            "people": people,
            "base_price": base_price,
            "subtotal": subtotal,
            "group_discount_applied": discount_applied,
            "group_discount_amount": discount if discount_applied else 0,
            "total": original_price
        },
        "pricing_type": "activity"
    }


def calculate_wellness_price(wellness_pricing: Dict, booking_details: Dict) -> Dict[str, Any]:
    """
    Calcula precio para bienestar (spas, gimnasios) con paquetes
    """
    booking_type = booking_details.get("booking_type", "single")  # "single" o "package"
    sessions = booking_details.get("sessions", 1)
    
    session_price = wellness_pricing.get("session_price", 0)
    package_price = wellness_pricing.get("package_price")
    sessions_in_package = wellness_pricing.get("sessions_in_package")
    
    if booking_type == "package" and package_price and sessions_in_package:
        # Opción de paquete
        original_price = package_price
        savings = (session_price * sessions_in_package) - package_price
        
        return {
            "original_price": original_price,
            "breakdown": {
                "booking_type": "package",
                "sessions_included": sessions_in_package,
                "package_price": package_price,
                "price_per_session": package_price / sessions_in_package,
                "savings": savings
            },
            "pricing_type": "wellness"
        }
    else:
        # Sesión individual
        original_price = session_price * sessions
        
        return {
            "original_price": original_price,
            "breakdown": {
                "booking_type": "single",
                "sessions": sessions,
                "price_per_session": session_price,
                "total": original_price
            },
            "pricing_type": "wellness"
        }


def calculate_entertainment_price(entertainment_pricing: Dict, booking_details: Dict) -> Dict[str, Any]:
    """
    Calcula precio para entretenimiento (cines, teatros) con descuentos estudiantes
    """
    ticket_type = booking_details.get("ticket_type", "general")  # "general" o "vip"
    quantity = booking_details.get("quantity", 1)
    is_student = booking_details.get("is_student", False)
    
    general_admission = entertainment_pricing.get("general_admission", 0)
    vip_admission = entertainment_pricing.get("vip_admission", 0)
    student_discount_percentage = entertainment_pricing.get("student_discount_percentage", 0)
    
    # Precio base según tipo de entrada
    if ticket_type == "vip" and vip_admission:
        base_price = vip_admission
    else:
        base_price = general_admission
    
    subtotal = base_price * quantity
    discount = 0
    
    # Aplicar descuento estudiante
    if is_student and student_discount_percentage:
        discount = subtotal * (student_discount_percentage / 100)
    
    original_price = subtotal - discount
    
    return {
        "original_price": original_price,
        "breakdown": {
            "ticket_type": ticket_type,
            "quantity": quantity,
            "base_price": base_price,
            "subtotal": subtotal,
            "student_discount_applied": is_student and discount > 0,
            "student_discount_amount": discount,
            "total": original_price
        },
        "pricing_type": "entertainment"
    }


def calculate_price_with_categories(
    business: Dict,
    booking_details: Dict
) -> Dict[str, Any]:
    """
    Determina el tipo de pricing según las categorías del negocio
    y calcula el precio correspondiente
    """
    categories = business.get("categories", [])
    
    # Prioridad de pricing según categorías
    # Alojamiento incluye: Alojamiento, Hotel, Hostel, etc.
    if ("Alojamiento" in categories or "Hotel" in categories or "Hostel" in categories) and business.get("hotel_pricing"):
        return calculate_hotel_price(business["hotel_pricing"], booking_details)
    
    elif ("Restaurante" in categories or "Vida Nocturna" in categories) and business.get("restaurant_pricing"):
        return calculate_restaurant_price(business["restaurant_pricing"], booking_details)
    
    elif "Bienestar" in categories and business.get("wellness_pricing"):
        return calculate_wellness_price(business["wellness_pricing"], booking_details)
    
    elif "Entretenimiento" in categories and business.get("entertainment_pricing"):
        return calculate_entertainment_price(business["entertainment_pricing"], booking_details)
    
    elif "Actividad" in categories and business.get("activity_pricing"):
        return calculate_activity_price(business["activity_pricing"], booking_details)
    
    elif business.get("ticket_pricing"):
        # Fallback a ticket pricing para atracciones, cultural, histórico, etc.
        return calculate_ticket_price(business["ticket_pricing"], booking_details)
    
    else:
        return {
            "original_price": 0,
            "breakdown": {},
            "errors": ["Este negocio no tiene precios configurados"],
            "pricing_type": "none"
        }


def apply_promotion_discount(
    original_price: float,
    promotion: Dict
) -> Dict[str, Any]:
    """
    Aplica descuento de promoción al precio original
    """
    discount_percentage = promotion.get("discount_percentage")
    discount_amount_fixed = promotion.get("discount_amount")
    
    if discount_percentage:
        discount_amount = original_price * (discount_percentage / 100)
        final_price = original_price - discount_amount
        return {
            "final_price": final_price,
            "discount_amount": discount_amount,
            "discount_percentage": discount_percentage,
            "promotion_applied": True
        }
    
    elif discount_amount_fixed:
        discount_amount = min(discount_amount_fixed, original_price)
        final_price = original_price - discount_amount
        discount_percentage = (discount_amount / original_price) * 100 if original_price > 0 else 0
        return {
            "final_price": final_price,
            "discount_amount": discount_amount,
            "discount_percentage": discount_percentage,
            "promotion_applied": True
        }
    
    else:
        return {
            "final_price": original_price,
            "discount_amount": 0,
            "discount_percentage": 0,
            "promotion_applied": False
        }
