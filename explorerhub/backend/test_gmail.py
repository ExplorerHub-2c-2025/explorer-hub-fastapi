#!/usr/bin/env python3
"""
Script temporal para probar Gmail SMTP con tus credenciales
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_gmail_smtp(username, password, test_email):
    """Test Gmail SMTP with provided credentials"""
    try:
        print(f"🔍 Testing Gmail SMTP with: {username}")

        # Create message
        msg = MIMEMultipart()
        msg['From'] = f"ExplorerHub <{username}>"
        msg['To'] = test_email
        msg['Subject'] = "Test Email - ExplorerHub"

        reset_link = "http://localhost:3000/reset-password?token=test-123"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: #573F23; margin: 0;">ExplorerHub</h1>
                <p style="color: #666; margin: 10px 0 0 0;">Test de Email</p>
            </div>

            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #573F23; margin-top: 0;">¡Email de prueba exitoso! 🎉</h2>
                <p style="color: #666; line-height: 1.6;">
                    Si recibes este email, significa que Gmail SMTP está configurado correctamente.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}"
                       style="background-color: #A08058; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Probar Reset Link
                    </a>
                </div>

                <p style="color: #999; font-size: 14px;">
                    Este es un email de prueba para verificar la configuración.
                </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>© 2024 ExplorerHub. Test exitoso.</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, 'html'))

        # Send email
        print("📡 Connecting to Gmail SMTP...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()

        print("🔐 Logging in...")
        server.login(username, password)

        print("📤 Sending email...")
        server.sendmail(username, test_email, msg.as_string())
        server.quit()

        print("✅ Email sent successfully!")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Gmail SMTP Test Tool")
    print("=" * 50)

    # Get credentials from user
    gmail_user = input("📧 Ingresa tu email de Gmail: ").strip()
    app_password = input("🔑 Ingresa tu App Password (16 caracteres): ").strip()
    test_email = input("📬 Email donde recibir la prueba: ").strip()

    print("\n🔍 Verificando credenciales...")
    print(f"📧 Gmail: {gmail_user}")
    print(f"📬 Destino: {test_email}")
    print()

    if len(app_password) != 16:
        print("⚠️  Advertencia: App Password debería tener 16 caracteres")
        print(f"   Tu password tiene {len(app_password)} caracteres")
        print()

    success = test_gmail_smtp(gmail_user, app_password, test_email)

    if success:
        print("\n🎉 ¡Configuración exitosa!")
        print("📝 Actualiza tu .env con estas credenciales:")
        print(f"   SMTP_USERNAME='{gmail_user}'")
        print(f"   SMTP_PASSWORD='{app_password}'")
        print(f"   FROM_EMAIL='{gmail_user}'")
    else:
        print("\n❌ Configuración fallida")
        print("💡 Verifica:")
        print("   - Que tengas 2FA activado en Gmail")
        print("   - Que el App Password sea correcto (16 caracteres)")
        print("   - Que no haya errores de tipeo")
