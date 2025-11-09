#!/usr/bin/env python3
"""
Script para verificar el tipo de token de Mailtrap
"""
import requests

def check_token_type(token):
    """Check what type of Mailtrap token this is"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Try to get account info
    try:
        response = requests.get('https://mailtrap.io/api/accounts', headers=headers)
        if response.status_code == 200:
            print("✅ Token válido para API de Mailtrap")
            account_data = response.json()
            print(f"📧 Account: {account_data.get('name', 'Unknown')}")
            return "api"
        elif response.status_code == 401:
            print("❌ Token inválido o sin permisos")
            return "invalid"
        else:
            print(f"⚠️  Respuesta inesperada: {response.status_code}")
            return "unknown"
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return "error"

def check_smtp_credentials(username, password):
    """Check if SMTP credentials work"""
    import smtplib

    try:
        server = smtplib.SMTP('smtp.mailtrap.io', 2525)
        server.starttls()
        server.login(username, password)
        server.quit()
        print("✅ Credenciales SMTP válidas")
        return True
    except Exception as e:
        print(f"❌ Credenciales SMTP inválidas: {e}")
        return False

if __name__ == "__main__":
    token = '1202139f5aef3a2c6f0ac11a71440ab6'

    print("🔍 Verificando tipo de token de Mailtrap...")
    print(f"🔑 Token: {token}")
    print()

    # Check API token
    print("📡 Probando como token de API:")
    api_result = check_token_type(token)
    print()

    # Check SMTP credentials
    print("📧 Probando como credenciales SMTP:")
    smtp_result = check_smtp_credentials('api', token)
    print()

    # Give recommendations
    print("📋 Recomendaciones:")
    if api_result == "api":
        print("✅ Usa la API de Mailtrap (ya configurada)")
    elif smtp_result:
        print("✅ Usa SMTP con username='api' y password=token")
        print("   Actualiza tu .env a configuración SMTP")
    else:
        print("❌ El token no es válido para envío")
        print("   Ve a https://mailtrap.io/api-tokens y crea un token de API")
        print("   O ve a tu inbox → SMTP Settings para credenciales SMTP")
