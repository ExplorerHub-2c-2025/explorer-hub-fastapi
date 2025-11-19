# 🔍 Guía de Diagnóstico de Promociones Flash Sale

## Endpoints de Diagnóstico Disponibles

El backend ahora tiene endpoints temporales para diagnosticar promociones:

### 1. Ver todas las promociones activas
```bash
curl http://localhost:8000/api/debug/promotions | jq
```

**Respuesta incluye:**
- Lista de todas las promociones activas
- Si cada una debería ser flash sale
- Si el estado actual coincide con el esperado

### 2. Diagnosticar una promoción específica
```bash
curl http://localhost:8000/api/debug/promotions/{ID} | jq
```

Reemplaza `{ID}` con el ID de tu promoción.

**Respuesta detallada incluye:**
```json
{
  "promotion_id": 123,
  "title": "Nombre de la promoción",
  "current_state": {
    "is_active": true,
    "is_flash_sale": false
  },
  "dates": {
    "today": "2025-11-19",
    "end_date": "2025-11-19",
    "end_date_parsed": "2025-11-19"
  },
  "codes": {
    "max_uses": 10,
    "current_uses": 7,
    "remaining": 3
  },
  "flash_sale_conditions": {
    "expires_today": true,
    "less_than_5_codes": true,
    "should_be_flash_sale": true
  },
  "diagnosis": {
    "is_expired": false,
    "current_flash_status": false,
    "expected_flash_status": true,
    "status_matches": false  // ❌ INCONSISTENCIA!
  }
}
```

## 📋 Checklist de Diagnóstico

### 1. Verificar datos en base de datos

Ejecuta uno de estos comandos para ver el estado actual:

```bash
# Ver todas las promociones
curl http://localhost:8000/api/debug/promotions

# Ver promoción específica (reemplaza 123 con el ID real)
curl http://localhost:8000/api/debug/promotions/123
```

### 2. Condiciones para ser Flash Sale

Una promoción es flash sale SOLO si cumple **AMBAS** condiciones:

✅ **Condición 1: Expira hoy**
- `end_date == "2025-11-19"` (hoy)

✅ **Condición 2: Quedan menos de 5 códigos**
- `remaining = max_uses - current_uses`
- `remaining < 5` AND `remaining > 0`

### 3. Verificar logs del servidor

Busca en la consola del backend mensajes como:

```
✅ FLASH SALE - Promoción #123 'Mi Promo' (expira hoy, quedan 3 códigos)
```

O:

```
⏰ DESACTIVADA - Promoción #123 'Mi Promo' (expiró el 2025-11-18)
```

### 4. Forzar actualización manual

Si la promoción no está marcada correctamente, puedes forzar la actualización de dos formas:

**Opción A: Reiniciar el servidor**
```bash
# El servidor ejecuta check_and_update_flash_sales al iniciar
# Ctrl+C para detener y luego volver a iniciar
```

**Opción B: Hacer una petición a /api/promotions**
```bash
# El endpoint GET ejecuta las funciones de verificación antes de devolver
curl "http://localhost:8000/api/promotions?business_id=1&active_only=true"
```

## 🐛 Problemas Comunes

### Problema 1: "Debería ser flash sale pero no lo es"

**Síntomas:**
- `should_be_flash_sale: true`
- `is_flash_sale: false`
- `status_matches: false`

**Solución:**
1. Hacer un GET a `/api/promotions` para forzar actualización
2. O reiniciar el servidor

### Problema 2: "La fecha se ve incorrecta"

**Síntomas:**
- En la BD dice `"2025-11-19"` pero muestra "18 nov"

**Solución:**
- Ya fue corregido en `components/promotion-card.tsx`
- Reinicia el frontend: `npm run dev`

### Problema 3: "Promoción expirada sigue apareciendo"

**Síntomas:**
- `end_date < today`
- `is_active: true` (debería ser false)

**Solución:**
- Hacer un GET a `/api/promotions` 
- La función `deactivate_expired_promotions` se ejecutará

### Problema 4: "Ninguna promoción aparece como flash"

**Verificar:**
```bash
# 1. Ver todas las promos
curl http://localhost:8000/api/debug/promotions | jq

# 2. Buscar alguna que cumpla condiciones:
#    - expires_today: true
#    - less_than_5: true
```

Si ninguna cumple, entonces es correcto que no haya flash sales.

## 🔧 Ejemplo de Uso Completo

```bash
# 1. Ver todas las promociones activas
curl http://localhost:8000/api/debug/promotions | jq '.'

# 2. Identificar una que debería ser flash
# Buscar en el JSON: "should_be_flash_sale": true

# 3. Ver diagnóstico detallado de esa promoción
curl http://localhost:8000/api/debug/promotions/123 | jq '.'

# 4. Si status_matches es false, forzar actualización
curl "http://localhost:8000/api/promotions?business_id=1&active_only=true" | jq '.'

# 5. Verificar nuevamente
curl http://localhost:8000/api/debug/promotions/123 | jq '.diagnosis.status_matches'
# Debería devolver: true
```

## 📊 Interpretación de Resultados

### Caso 1: Todo OK ✅
```json
{
  "flash_sale_conditions": {
    "expires_today": true,
    "less_than_5_codes": true,
    "should_be_flash_sale": true
  },
  "diagnosis": {
    "current_flash_status": true,
    "expected_flash_status": true,
    "status_matches": true  // ✅
  }
}
```

### Caso 2: NO debe ser flash (correcto) ✅
```json
{
  "flash_sale_conditions": {
    "expires_today": false,  // Expira otro día
    "less_than_5_codes": true,
    "should_be_flash_sale": false
  },
  "diagnosis": {
    "status_matches": true  // ✅
  }
}
```

### Caso 3: Inconsistencia ❌
```json
{
  "diagnosis": {
    "current_flash_status": false,
    "expected_flash_status": true,
    "status_matches": false  // ❌ Requiere actualización
  }
}
```

## 🗑️ Limpiar después del diagnóstico

Una vez resuelto el problema, puedes remover el endpoint de debug:

1. Comentar o eliminar en `main.py`:
```python
# app.include_router(debug_routes.debug_router)
```

2. O mantenerlo para futuros diagnósticos (es solo lectura, no modifica nada)

---

**Fecha de creación:** 19 de Noviembre de 2025
