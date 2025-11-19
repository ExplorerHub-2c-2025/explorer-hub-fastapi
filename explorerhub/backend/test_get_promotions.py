"""
Test para verificar que las promociones expiradas no aparecen en el endpoint GET
"""
import asyncio
from datetime import date, timedelta
from test_flash_checker_run import MockDB

# Simular el comportamiento del endpoint get_promotions
async def get_promotions_endpoint(db, business_id=None, active_only=True):
    """Simula el endpoint GET /api/promotions"""
    from flash_sale_checker import check_and_update_flash_sales, deactivate_expired_promotions
    
    # Primero desactivar promociones expiradas, luego actualizar flash sales
    await deactivate_expired_promotions(db)
    await check_and_update_flash_sales(db)
    
    # Construir query
    query = {}
    if business_id:
        query["business_id"] = business_id
    
    if active_only:
        query["is_active"] = True
    
    # Filtrar promociones
    all_promos = db.promotions._items
    filtered = []
    for promo in all_promos:
        match = True
        for key, value in query.items():
            if promo.get(key) != value:
                match = False
                break
        if match:
            filtered.append(promo)
    
    return filtered


async def test_expired_promotions_not_shown():
    """Test que las promociones expiradas no aparecen en el listado"""
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    
    promotions = [
        {
            "id": 1,
            "business_id": 100,
            "title": "Promo Activa y Válida",
            "start_date": today,
            "end_date": tomorrow,
            "max_uses": 100,
            "current_uses": 10,
            "is_active": True,
            "is_flash_sale": False,
        },
        {
            "id": 2,
            "business_id": 100,
            "title": "Promo EXPIRADA - No debería aparecer",
            "start_date": yesterday,
            "end_date": yesterday,
            "max_uses": 100,
            "current_uses": 10,
            "is_active": True,  # Todavía marcada como activa (antes del check)
            "is_flash_sale": False,
        },
        {
            "id": 3,
            "business_id": 200,
            "title": "Promo de otro negocio",
            "start_date": today,
            "end_date": tomorrow,
            "max_uses": 100,
            "current_uses": 10,
            "is_active": True,
            "is_flash_sale": False,
        },
    ]
    
    db = MockDB(promotions)
    
    print("=== TEST: Promociones Expiradas NO deben aparecer ===\n")
    print("ANTES del check:")
    for p in promotions:
        print(f"  ID {p['id']}: is_active={p['is_active']}, end_date={p['end_date']}, title={p['title']}")
    
    # Llamar al endpoint con active_only=True y business_id=100
    result = await get_promotions_endpoint(db, business_id=100, active_only=True)
    
    print("\nDESPUÉS del check:")
    for p in promotions:
        print(f"  ID {p['id']}: is_active={p['is_active']}, end_date={p['end_date']}, title={p['title']}")
    
    print(f"\nPromociones DEVUELTAS por el endpoint (business_id=100, active_only=True):")
    for p in result:
        print(f"  ID {p['id']}: {p['title']}")
    
    print("\n=== VALIDACIONES ===")
    
    # Validar que solo aparece la promo 1
    assert len(result) == 1, f"Debería devolver solo 1 promoción, pero devolvió {len(result)}"
    print("✅ Solo se devuelve 1 promoción")
    
    assert result[0]["id"] == 1, "La promoción devuelta debería ser la ID 1"
    print("✅ La promoción devuelta es la correcta (ID 1)")
    
    # Validar que la promo 2 está desactivada
    assert promotions[1]["is_active"] == False, "La promo 2 (expirada) debería estar inactiva"
    print("✅ La promo 2 fue marcada como inactiva correctamente")
    
    # Validar que la promo 3 sigue activa pero no aparece (diferente business_id)
    assert promotions[2]["is_active"] == True, "La promo 3 debería seguir activa"
    print("✅ La promo 3 sigue activa (es de otro negocio)")
    
    print("\n🎉 TEST EXITOSO: Las promociones expiradas NO aparecen en el listado")


if __name__ == "__main__":
    asyncio.run(test_expired_promotions_not_shown())
