#!/usr/bin/env python3
"""
Script para probar diferentes configuraciones de Mailtrap SMTP
"""
import smtplib
from email.mime.text import MIMEText

def test_smtp_config(username, password):
    """Test SMTP connection with given credentials"""
    try:
        print(f"🔍 Testing SMTP with username: '{username}'")

        server = smtplib.SMTP('smtp.mailtrap.io', 2525)
        server.starttls()

        server.login(username, password)
        print("✅ Login successful!")

        # Create test message
        msg = MIMEText('Test message from ExplorerHub')
        msg['Subject'] = 'Test Email'
        msg['From'] = 'noreply@explorerhub.com'
        msg['To'] = 'fcalderan@fi.uba.ar'

        # Send test email
        server.sendmail('noreply@explorerhub.com', 'fcalderan@fi.uba.ar', msg.as_string())
        server.quit()

        print("✅ Email sent successfully!")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing different Mailtrap SMTP configurations...\n")

    # Configuration 1: API token as password
    print("📧 Config 1: Username='api', Password=API_TOKEN")
    test_smtp_config('api', '1202139f5aef3a2c6f0ac11a71440ab6')
    print()

    # Configuration 2: Ask user for real SMTP credentials
    print("📧 Config 2: Revisa tus credenciales SMTP en https://mailtrap.io/inboxes")
    print("   Ve a tu inbox → SMTP Settings → copia Username y Password")
    print("   Luego actualiza el .env con las credenciales correctas")
    print()
    print("🔧 Configuración actual en .env:")
    print("   SMTP_USERNAME='api'")
    print("   SMTP_PASSWORD='1202139f5aef3a2c6f0ac11a71440ab6'")
    print()
    print("💡 Si no funciona, ve a Mailtrap → Inboxes → [tu inbox] → SMTP Settings")
