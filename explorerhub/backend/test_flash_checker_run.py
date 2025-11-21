import asyncio
from datetime import date, datetime

# Import the functions under test
from flash_sale_checker import check_and_update_flash_sales, check_promotion_after_use, deactivate_expired_promotions

# Minimal mock DB
class MockCursor:
    def __init__(self, items):
        self._items = items
    async def to_list(self, length=None):
        return self._items

class MockCollection:
    def __init__(self, items):
        # items is a list of dicts representing promotions
        self._items = items
    def find(self, query):
        # naive filter: return all that match keys exactly when provided
        def matches(doc):
            for k, v in query.items():
                if doc.get(k) != v:
                    return False
            return True
        filtered = [d for d in self._items if matches(d)]
        return MockCursor(filtered)
    async def find_one(self, query):
        for d in self._items:
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                return d
        return None
    async def update_one(self, query, update):
        doc = await self.find_one(query)
        if not doc:
            return None
        # only handle $set and $inc used in code
        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = doc.get(k, 0) + v
        return True

class MockDB:
    def __init__(self, promotions):
        self.promotions = MockCollection(promotions)
        self.businesses = MockCollection([{"id": 1, "name": "Biz 1", "images": ["img1.jpg"], "rating": 4.5, "location": {"city": "City"}}])

async def run_tests():
    from datetime import timedelta
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    
    promos = [
        {
            "id": 100,
            "business_id": 1,
            "title": "Promo Expira Hoy y queda 3 - DEBE SER FLASH",
            "start_date": today,
            "end_date": today,
            "max_uses": 10,
            "current_uses": 7,
            "is_active": True,
            "is_flash_sale": False,
            "created_at": None
        },
        {
            "id": 101,
            "business_id": 1,
            "title": "Promo Expira Mañana y queda 3 - NO DEBE SER FLASH",
            "start_date": today,
            "end_date": tomorrow,
            "max_uses": 10,
            "current_uses": 7,
            "is_active": True,
            "is_flash_sale": False,
            "created_at": None
        },
        {
            "id": 102,
            "business_id": 1,
            "title": "Promo Expiró Ayer - DEBE DESACTIVARSE",
            "start_date": yesterday,
            "end_date": yesterday,
            "max_uses": 10,
            "current_uses": 3,
            "is_active": True,
            "is_flash_sale": False,
            "created_at": None
        },
        {
            "id": 103,
            "business_id": 1,
            "title": "Promo Expira Hoy pero queda 10 - NO DEBE SER FLASH",
            "start_date": today,
            "end_date": today,
            "max_uses": 20,
            "current_uses": 10,
            "is_active": True,
            "is_flash_sale": False,
            "created_at": None
        }
    ]

    db = MockDB(promos)

    print("=== ANTES DE CHEQUEAR ===")
    for p in promos:
        print(f"ID {p['id']}: is_active={p['is_active']}, is_flash_sale={p['is_flash_sale']}, title={p['title']}")

    print("\n=== PASO 1: Desactivar promociones expiradas ===")
    deactivated = await deactivate_expired_promotions(db)
    print(f"Promociones desactivadas: {deactivated}")
    
    print("\n=== PASO 2: Actualizar flash sales ===")
    updated = await check_and_update_flash_sales(db)
    print(f"Flash sales actualizadas: {updated}\n")
    
    print("=== DESPUÉS DE CHEQUEAR ===")
    for p in promos:
        print(f"ID {p['id']}: is_active={p['is_active']}, is_flash_sale={p['is_flash_sale']}, title={p['title']}")

    print("\n=== VALIDACIONES ===")
    assert promos[0]["is_flash_sale"] == True, "Promo 100 debería ser flash sale (expira hoy y <5 códigos)"
    assert promos[0]["is_active"] == True, "Promo 100 debería estar activa"
    print("✅ Promo 100: FLASH SALE correctamente")
    
    assert promos[1]["is_flash_sale"] == False, "Promo 101 NO debería ser flash sale (expira mañana)"
    assert promos[1]["is_active"] == True, "Promo 101 debería estar activa"
    print("✅ Promo 101: NO es flash sale correctamente")
    
    assert promos[2]["is_active"] == False, "Promo 102 debería estar INACTIVA (expiró ayer)"
    assert promos[2]["is_flash_sale"] == False, "Promo 102 NO debería ser flash sale (está inactiva)"
    print("✅ Promo 102: DESACTIVADA correctamente")
    
    assert promos[3]["is_flash_sale"] == False, "Promo 103 NO debería ser flash sale (quedan >5 códigos)"
    assert promos[3]["is_active"] == True, "Promo 103 debería estar activa"
    print("✅ Promo 103: NO es flash sale correctamente (quedan muchos códigos)")

    # Test check_promotion_after_use
    print("\n=== TEST check_promotion_after_use ===")
    promos[1]["max_uses"] = 20  # Asegurar que tengamos espacio para decrementar
    promos[1]["current_uses"] = 17  # remaining = 20 - 17 = 3 < 5
    promos[1]["end_date"] = today  # cambiar a hoy
    res = await check_promotion_after_use(db, 101)
    print(f"check_promotion_after_use result for 101: {res}")
    print(f"Promo 101 después: is_flash_sale={promos[1]['is_flash_sale']}")
    assert promos[1]["is_flash_sale"] == True, "Promo 101 debería convertirse en flash sale"
    print("✅ check_promotion_after_use funciona correctamente")
    
    print("\n🎉 TODOS LOS TESTS PASARON 🎉")

if __name__ == '__main__':
    asyncio.run(run_tests())
