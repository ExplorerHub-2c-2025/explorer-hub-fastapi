#!/usr/bin/env python3
"""
Test script for email service
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from email_service import email_service

def test_email():
    """Test email sending using Gmail SMTP"""
    # ⚠️ CAMBIA ESTO por tu email real para probar
    test_email = "pruebauba@yopmail.com"
    test_token = "test-token-12345"

    print("🧪 Testing email service with Gmail SMTP...")
    print(f"📧 Sending test email to: {test_email}")
    print(f"🔧 SMTP Config: {email_service.smtp_server}:{email_service.smtp_port}")
    print(f"👤 Username: {email_service.smtp_username}")
    print(f"📤 From: {email_service.from_email}")
    print()

    if not email_service.smtp_username or not email_service.smtp_password:
        print("❌ ERROR: Gmail SMTP credentials not configured!")
        print("📝 Please configure your Gmail credentials in .env file")
        print("🔑 Need: 2FA enabled + App Password (16 characters)")
        print("📖 See EMAIL_SETUP.md for detailed instructions")
        return

    if email_service.smtp_username == 'tu-email@gmail.com':
        print("❌ ERROR: You need to replace 'tu-email@gmail.com' with your real Gmail address!")
        print("📝 Edit the SMTP_USERNAME in your .env file")
        return

    if email_service.smtp_password == 'tu-app-password':
        print("❌ ERROR: You need to replace 'tu-app-password' with your real App Password!")
        print("📝 Edit the SMTP_PASSWORD in your .env file")
        print("🔑 Get App Password from: https://support.google.com/accounts/answer/185833")
        return

    print("📡 Attempting to send email via Gmail SMTP...")
    success = email_service.send_password_reset_email(test_email, test_token)

    if success:
        print("✅ Email sent successfully via Gmail!")
        print(f"📬 Check your inbox at {test_email}")
        print("⚠️  If you don't see it, check your spam/junk folder")
        print("🔄 Gmail may mark initial emails as spam")
        print("🎉 Your email service is now configured for production!")
    else:
        print("❌ Failed to send email")
        print("🔍 Check the error messages above")
        print("💡 Common issues:")
        print("   - Wrong App Password (use 16-character App Password, not regular password)")
        print("   - 2FA not enabled on Gmail account")
        print("   - Firewall blocking port 587")

if __name__ == "__main__":
    test_email()
