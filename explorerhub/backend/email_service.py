import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv
from config import settings

# Load environment variables
load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.smtp_username = settings.smtp_username
        self.smtp_password = settings.smtp_password
        self.use_tls = settings.mail_use_tls
        self.use_ssl = settings.mail_use_ssl
        self.from_email = settings.from_email
        self.from_name = settings.from_name

    def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        """Send password reset email"""
        try:
            # Debug logging
            print(f"Attempting to send email to: {to_email}")
            print(f"SMTP Server: {self.smtp_server}:{self.smtp_port}")
            print(f"From: {self.from_email}")
            
            # Check if credentials are configured
            if not self.smtp_username or not self.smtp_password:
                print("ERROR: SMTP credentials not configured")
                return False
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = "Restablecer contraseña - ExplorerHub"

            # Create reset link
            reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

            # HTML body
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #573F23; margin: 0;">ExplorerHub</h1>
                    <p style="color: #666; margin: 10px 0 0 0;">Restablecer contraseña</p>
                </div>

                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #573F23; margin-top: 0;">¿Olvidaste tu contraseña?</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña.
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}"
                           style="background-color: #A08058; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Restablecer contraseña
                        </a>
                    </div>

                    <p style="color: #999; font-size: 14px; margin-bottom: 20px;">
                        Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.
                    </p>

                    <p style="color: #999; font-size: 14px;">
                        Este enlace expirará en 1 hora por seguridad.
                    </p>
                </div>

                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2024 ExplorerHub. Todos los derechos reservados.</p>
                </div>
            </body>
            </html>
            """

            # Plain text body
            text_body = f"""
            Restablecer contraseña - ExplorerHub

            Recibimos una solicitud para restablecer tu contraseña.

            Para restablecer tu contraseña, visita el siguiente enlace:
            {reset_link}

            Este enlace expirará en 1 hora.

            Si no solicitaste este cambio, puedes ignorar este email.
            """

            # Attach parts
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            # Send email
            print("Connecting to SMTP server...")
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            
            if self.use_ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            elif self.use_tls:
                server.starttls()
            
            print("Logging in...")
            server.login(self.smtp_username, self.smtp_password)
            print("Sending email...")
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            print("Email sent successfully!")
            
            return True

        except Exception as e:
            print(f"Error sending email: {e}")
            import traceback
            traceback.print_exc()
            return False

# Global instance
email_service = EmailService()
