"""
Script de prueba para el sistema de precios y promociones
"""

import requests
import json
from datetime import date, timedelta

BASE_URL = "http://localhost:8000"

# Colores para la consola
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_test(name, status="INFO"):
    """Imprimir nombre de prueba"""
    color = Colors.OKBLUE if status == "INFO" else Colors.OKGREEN if status == "SUCCESS" else Colors.FAIL
    print(f"\n{color}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{color}{Colors.BOLD}[{status}] {name}{Colors.ENDC}")
    print(f"{color}{Colors.BOLD}{'='*60}{Colors.ENDC}")


def print_response(response):
    """Imprimir respuesta formateada"""
    print(f"\n{Colors.OKCYAN}Status Code: {response.status_code}{Colors.ENDC}")
    if response.status_code < 400:
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
    else:
        print(f"{Colors.FAIL}{response.text}{Colors.ENDC}")


def test_create_business_with_pricing(token):
    """Prueba 1: Crear un negocio con precios"""
    print_test("Prueba 1: Crear negocio con precios", "INFO")
    
    business_data = {
        "name": "Museo de Historia Test",
        "description": "Museo de prueba con sistema de precios",
        "categories": ["Museos"],
        "location": {
            "address": "Calle Test 123",
            "city": "Ciudad Test",
            "state": "Estado Test",
            "country": "País Test"
        },
        "price_level": 2,
        "allows_bookings": True,
        "ticket_pricing": {
            "adult_price": 15.00,
            "senior_price": 10.00,
            "child_price": 8.00
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/businesses/",
        json=business_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print_response(response)
    
    if response.status_code == 201:
        print_test("Prueba 1: EXITOSA", "SUCCESS")
        return response.json()["id"]
    else:
        print_test("Prueba 1: FALLIDA", "FAIL")
        return None


def test_create_automatic_promotion(token, business_id):
    """Prueba 2: Crear promoción automática"""
    print_test("Prueba 2: Crear promoción automática", "INFO")
    
    promotion_data = {
        "title": "Descuento de Inauguración",
        "description": "20% de descuento automático en todas las entradas",
        "promotion_type": "automatic",
        "discount_percentage": 20,
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=7)),
        "min_purchase": 10.00,
        "terms_conditions": "Válido solo para reservas online. No acumulable con otras promociones."
    }
    
    response = requests.post(
        f"{BASE_URL}/api/promotions/?business_id={business_id}",
        json=promotion_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print_response(response)
    
    if response.status_code == 201:
        print_test("Prueba 2: EXITOSA", "SUCCESS")
        return response.json()["id"]
    else:
        print_test("Prueba 2: FALLIDA", "FAIL")
        return None


def test_create_code_promotion(token, business_id):
    """Prueba 3: Crear promoción con código"""
    print_test("Prueba 3: Crear promoción con código", "INFO")
    
    promotion_data = {
        "title": "Código Especial VIP",
        "description": "30% de descuento con código especial",
        "promotion_type": "code",
        "code": "VIP30",
        "discount_percentage": 30,
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=14)),
        "max_uses": 50,
        "min_purchase": 20.00,
        "terms_conditions": "Solo para miembros VIP. Límite de 50 usos."
    }
    
    response = requests.post(
        f"{BASE_URL}/api/promotions/?business_id={business_id}",
        json=promotion_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print_response(response)
    
    if response.status_code == 201:
        print_test("Prueba 3: EXITOSA", "SUCCESS")
        return response.json()["id"]
    else:
        print_test("Prueba 3: FALLIDA", "FAIL")
        return None


def test_get_automatic_promotions(business_id):
    """Prueba 4: Obtener promociones automáticas"""
    print_test("Prueba 4: Obtener promociones automáticas", "INFO")
    
    response = requests.get(f"{BASE_URL}/api/promotions/automatic/{business_id}")
    
    print_response(response)
    
    if response.status_code == 200:
        promotions = response.json()
        print(f"\n{Colors.OKGREEN}Promociones automáticas encontradas: {len(promotions)}{Colors.ENDC}")
        print_test("Prueba 4: EXITOSA", "SUCCESS")
        return True
    else:
        print_test("Prueba 4: FALLIDA", "FAIL")
        return False


def test_calculate_price(token, business_id):
    """Prueba 5: Calcular precio con promoción automática"""
    print_test("Prueba 5: Calcular precio con promoción", "INFO")
    
    ticket_data = {
        "ticket_selection": {
            "adult_count": 2,
            "senior_count": 1,
            "child_count": 2
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/businesses/{business_id}/calculate-price",
        json=ticket_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n{Colors.OKGREEN}Precio Original: ${data['original_price']:.2f}{Colors.ENDC}")
        print(f"{Colors.OKGREEN}Descuento: {data['discount_percentage']:.0f}% (-${data['discount_amount']:.2f}){Colors.ENDC}")
        print(f"{Colors.OKGREEN}Precio Final: ${data['final_price']:.2f}{Colors.ENDC}")
        print_test("Prueba 5: EXITOSA", "SUCCESS")
        return True
    else:
        print_test("Prueba 5: FALLIDA", "FAIL")
        return False


def main():
    """Ejecutar todas las pruebas"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║   PRUEBAS DEL SISTEMA DE PRECIOS Y PROMOCIONES           ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)
    
    # Solicitar token
    print(f"{Colors.WARNING}⚠️  Necesitas un token de autenticación de un usuario 'business'{Colors.ENDC}")
    token = input("Ingresa tu token de autenticación: ").strip()
    
    if not token:
        print(f"{Colors.FAIL}Error: Token requerido{Colors.ENDC}")
        return
    
    # Ejecutar pruebas
    business_id = test_create_business_with_pricing(token)
    if not business_id:
        print(f"{Colors.FAIL}No se puede continuar sin crear un negocio{Colors.ENDC}")
        return
    
    promo_auto_id = test_create_automatic_promotion(token, business_id)
    promo_code_id = test_create_code_promotion(token, business_id)
    
    test_get_automatic_promotions(business_id)
    test_calculate_price(token, business_id)
    
    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║                  PRUEBAS COMPLETADAS                      ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)
    
    print(f"\n{Colors.OKGREEN}IDs creados:{Colors.ENDC}")
    print(f"  Business ID: {business_id}")
    print(f"  Promotion Automática ID: {promo_auto_id}")
    print(f"  Promotion Código ID: {promo_code_id}")


if __name__ == "__main__":
    main()
