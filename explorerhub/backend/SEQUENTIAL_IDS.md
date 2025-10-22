# Sistema de IDs Secuenciales

## Descripción

El sistema ahora utiliza IDs secuenciales (1, 2, 3, etc.) en lugar de ObjectIds de MongoDB para todas las entidades. Esto simplifica las URLs y referencias en el frontend.

## Cambios Implementados

### 1. Modelo de Contador
- **Archivo**: `backend/models/counter.py`
- Implementa un contador atómico usando `findOneAndUpdate` de MongoDB
- Función `get_next_sequence_value()` obtiene el siguiente ID para cada colección

### 2. Colecciones con IDs Secuenciales
- `users`: IDs 1, 2, 3...
- `businesses`: IDs 1, 2, 3...
- `reviews`: IDs 1, 2, 3...
- `trips`: IDs 1, 2, 3...

### 3. Actualización de Rutas
Todas las rutas fueron actualizadas para:
- Usar el campo `id` (entero) en lugar de `_id` (ObjectId)
- Eliminar validaciones de ObjectId
- Cambiar parámetros de tipo `str` a `int` en las rutas

**Archivos modificados**:
- `routes/auth.py` - Registro de usuarios con ID secuencial
- `routes/businesses.py` - CRUD de negocios con IDs secuenciales
- `routes/reviews.py` - CRUD de reseñas con IDs secuenciales
- `routes/trips.py` - CRUD de viajes con IDs secuenciales

### 4. Utilidades de Serialización
- **Archivo**: `backend/utils.py`
- Función `serialize_doc()` ahora elimina el campo `_id`
- El campo `id` es manejado por cada endpoint al crear documentos

## Inicialización

### Primera Vez (Base de Datos Nueva)
```bash
cd backend
source .venv/bin/activate
python scripts/initialize_counters.py
```

Este script crea la colección `counters` con documentos para cada entidad:
```javascript
{
  "collection_name": "users",
  "sequence_value": 0
}
```

### Migración desde Base de Datos Existente

Si ya tienes datos en la base de datos, necesitas:

1. **Asignar IDs secuenciales a documentos existentes**:
```python
# Ejemplo para users
async def migrate_users():
    users = await db.users.find({}).to_list(length=None)
    for i, user in enumerate(users, start=1):
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"id": i}}
        )
    # Actualizar contador
    await db.counters.update_one(
        {"collection_name": "users"},
        {"$set": {"sequence_value": len(users)}},
        upsert=True
    )
```

2. **Repetir para todas las colecciones** (businesses, reviews, trips)

## Uso en el Frontend

### Antes (con ObjectId):
```typescript
// URL: /business/507f1f77bcf86cd799439011
fetch(`/api/businesses/${business._id}`)
```

### Ahora (con ID secuencial):
```typescript
// URL: /business/1
fetch(`/api/businesses/${business.id}`)
```

## Ventajas

1. **URLs más legibles**: `/business/1` en lugar de `/business/507f1f77bcf86cd799439011`
2. **Debugging más fácil**: IDs simples de recordar y buscar
3. **Frontend más simple**: No necesita manejar ObjectIds
4. **Compatibilidad**: Los IDs son números enteros estándar

## Consideraciones

1. **Concurrencia**: El sistema usa operaciones atómicas de MongoDB para evitar duplicados
2. **Performance**: El counter lookup agrega una query extra, pero es muy rápida
3. **Escalabilidad**: Para sistemas con millones de inserciones por segundo, considera sharding o UUIDs
4. **Migración**: Los documentos existentes mantienen su `_id`, pero usan el nuevo campo `id`

## Ejemplo de Documento

### Usuario en MongoDB:
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),  // Generado por MongoDB (no usado en API)
  "id": 1,                                       // ID secuencial (usado en API)
  "email": "usuario@example.com",
  "full_name": "Usuario Test",
  "role": "client",
  ...
}
```

### Respuesta de API:
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "full_name": "Usuario Test",
  "role": "client",
  ...
}
```

Nota: El campo `_id` se elimina en las respuestas de la API.
