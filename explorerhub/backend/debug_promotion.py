"""
Script de diagnóstico para verificar por qué una promoción no es flash sale
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime
from database import Database

async def debug_promotion(promotion_id: int = None):
    """
    Diagnóstica una promoción específica o todas las promociones activas
    """
    # Conectar a la base de datos
    await Database.connect_db()
    db = Database.get_db()
    
    today = date.today()
    print(f"📅 Fecha de hoy: {today} ({today.isoformat()})")
    print("=" * 80)
    
    # Buscar promociones
    if promotion_id:
        query = {"id": promotion_id}
        print(f"🔍 Buscando promoción ID: {promotion_id}\n")
    else:
        query = {"is_active": True}
        print("🔍 Buscando TODAS las promociones activas\n")
    
    cursor = db.promotions.find(query)
    promotions = await cursor.to_list(length=100)
    
    if not promotions:
        print("❌ No se encontraron promociones")
        return
    
    print(f"✅ Encontradas {len(promotions)} promoción(es)\n")
    print("=" * 80)
    
    for promo in promotions:
        print(f"\n{'='*80}")
        print(f"📋 PROMOCIÓN ID: {promo.get('id')}")
        print(f"   Título: {promo.get('title')}")
        print(f"   Negocio ID: {promo.get('business_id')}")
        print(f"{'='*80}")
        
        # Estado actual
        print(f"\n📊 ESTADO ACTUAL:")
        print(f"   is_active: {promo.get('is_active')}")
        print(f"   is_flash_sale: {promo.get('is_flash_sale')}")
        
        # Fechas
        print(f"\n📅 FECHAS:")
        start_date_str = promo.get('start_date')
        end_date_str = promo.get('end_date')
        print(f"   start_date (raw): {start_date_str} (tipo: {type(start_date_str).__name__})")
        print(f"   end_date (raw): {end_date_str} (tipo: {type(end_date_str).__name__})")
        
        # Parsear end_date
        end_date = None
        if end_date_str:
            if isinstance(end_date_str, str):
                try:
                    end_date = date.fromisoformat(end_date_str)
                    print(f"   end_date (parsed): {end_date}")
                except Exception as e:
                    print(f"   ❌ Error parseando end_date: {e}")
            else:
                end_date = end_date_str
                print(f"   end_date (ya es date): {end_date}")
        
        # Verificar condición de tiempo
        print(f"\n⏰ CONDICIÓN DE TIEMPO (expira hoy):")
        if end_date:
            print(f"   end_date: {end_date}")
            print(f"   today: {today}")
            print(f"   end_date == today: {end_date == today}")
            print(f"   end_date < today: {end_date < today}")
            print(f"   end_date > today: {end_date > today}")
            
            if end_date < today:
                print(f"   ⚠️  PROMOCIÓN EXPIRADA - Debería estar inactiva")
            elif end_date == today:
                print(f"   ✅ EXPIRA HOY - Cumple condición de tiempo para flash sale")
            else:
                print(f"   ❌ NO expira hoy - NO cumple condición de tiempo")
        else:
            print(f"   ❌ No tiene end_date válida")
        
        # Códigos restantes
        print(f"\n🎟️  CONDICIÓN DE CÓDIGOS (quedan menos de 5):")
        max_uses = promo.get('max_uses')
        current_uses = promo.get('current_uses', 0)
        
        if max_uses is not None:
            remaining = max_uses - current_uses
            print(f"   max_uses: {max_uses}")
            print(f"   current_uses: {current_uses}")
            print(f"   remaining: {remaining}")
            print(f"   remaining < 5: {remaining < 5}")
            print(f"   remaining > 0: {remaining > 0}")
            
            if remaining < 5 and remaining > 0:
                print(f"   ✅ QUEDAN MENOS DE 5 - Cumple condición de códigos")
            elif remaining <= 0:
                print(f"   ⚠️  SIN CÓDIGOS DISPONIBLES - No puede ser flash sale")
            else:
                print(f"   ❌ QUEDAN {remaining} CÓDIGOS - NO cumple condición (necesita < 5)")
        else:
            print(f"   ❌ No tiene max_uses definido - No puede ser flash sale")
        
        # Diagnóstico final
        print(f"\n🎯 DIAGNÓSTICO FINAL:")
        
        should_be_flash = False
        reasons = []
        
        # Verificar si debe estar inactiva
        if end_date and end_date < today:
            print(f"   ⚠️  DEBE DESACTIVARSE: end_date ({end_date}) < today ({today})")
            reasons.append("Promoción expirada")
        
        # Verificar condiciones de flash sale
        low_time = end_date and end_date == today
        low_remaining = max_uses is not None and (max_uses - current_uses) < 5 and (max_uses - current_uses) > 0
        
        print(f"\n   Condición 1 (expira hoy): {low_time}")
        print(f"   Condición 2 (< 5 códigos): {low_remaining}")
        
        if low_time and low_remaining:
            should_be_flash = True
            print(f"\n   ✅ DEBERÍA SER FLASH SALE")
            print(f"      - Expira hoy: {end_date}")
            print(f"      - Quedan {remaining} códigos")
        else:
            print(f"\n   ❌ NO DEBERÍA SER FLASH SALE")
            if not low_time:
                print(f"      ❌ NO expira hoy (end_date: {end_date})")
            if not low_remaining:
                if max_uses is None:
                    print(f"      ❌ NO tiene max_uses definido")
                elif remaining <= 0:
                    print(f"      ❌ Sin códigos disponibles")
                else:
                    print(f"      ❌ Quedan {remaining} códigos (necesita < 5)")
        
        # Comparar con estado actual
        current_flash_status = promo.get('is_flash_sale', False)
        if should_be_flash != current_flash_status:
            print(f"\n   ⚠️  INCONSISTENCIA DETECTADA:")
            print(f"      Estado actual: is_flash_sale = {current_flash_status}")
            print(f"      Estado esperado: is_flash_sale = {should_be_flash}")
            print(f"\n   💡 SOLUCIÓN: Ejecutar check_and_update_flash_sales()")
        else:
            print(f"\n   ✅ Estado correcto: is_flash_sale = {current_flash_status}")
    
    print(f"\n{'='*80}")
    await Database.close_db()

async def main():
    import sys
    
    print("\n" + "="*80)
    print("🔍 DIAGNÓSTICO DE PROMOCIONES FLASH SALE")
    print("="*80 + "\n")
    
    if len(sys.argv) > 1:
        try:
            promo_id = int(sys.argv[1])
            await debug_promotion(promo_id)
        except ValueError:
            print("❌ Error: El ID debe ser un número")
    else:
        print("💡 Uso: python debug_promotion.py [ID]")
        print("   Sin ID: Muestra todas las promociones activas")
        print("   Con ID: Muestra diagnóstico detallado de esa promoción\n")
        await debug_promotion()

if __name__ == "__main__":
    asyncio.run(main())
