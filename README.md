# ExplorerHub - Full Stack Application

Aplicación completa para explorar y gestionar experiencias de viaje, con sistema de negocios y usuarios.

## Arquitectura

- **Frontend**: Next.js 14+ con TypeScript y Tailwind CSS
- **Backend**: FastAPI (Python) con MongoDB
- **Base de Datos**: MongoDB

## Estructura del Proyecto

```
explorer-hub-fastapi/
├── explorerhub/          # Frontend Next.js
│   ├── app/              # App router de Next.js
│   ├── components/       # Componentes React
│   ├── lib/              # Utilidades y helpers
│   └── backend/          # Backend FastAPI
│       ├── models/       # Modelos Pydantic
│       └── routes/       # Rutas de la API
```

## Requisitos Previos

- Python 3.8+
- Node.js 18+
- MongoDB (local o remoto)

## Instalación

### 1. Backend (FastAPI)

```bash
cd explorerhub/backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar el servidor
uvicorn main:app --reload --port 8000
```

El backend estará disponible en: `http://localhost:8000`

### 2. Frontend (Next.js)

```bash
cd explorerhub

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

## Configuración

### Backend (.env en backend/)

Crear archivo `.env` en `explorerhub/backend/`:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=ExplorerHub
JWT_SECRET_KEY=tu-clave-secreta-aqui
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env.local)

Ya existe el archivo `explorerhub/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Base de Datos MongoDB

### Colecciones

- **users**: Usuarios (viajeros y negocios)
- **businesses**: Información de negocios
- **reviews**: Reseñas de negocios
- **trips**: Viajes planificados por usuarios

### Crear Índices

```bash
cd explorerhub/backend
python scripts/create_indexes.py
```

### Datos de Prueba (Opcional)

```bash
cd explorerhub/backend
python scripts/seed_data.py
```

## Endpoints Principales

### Autenticación
- `POST /api/auth/signup` - Registro de usuario/negocio
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Información del usuario actual

### Negocios
- `GET /api/businesses` - Listar negocios
- `POST /api/businesses` - Crear negocio
- `GET /api/businesses/{id}` - Obtener negocio
- `PUT /api/businesses/{id}` - Actualizar negocio
- `DELETE /api/businesses/{id}` - Eliminar negocio

### Reseñas
- `POST /api/reviews` - Crear reseña
- `GET /api/reviews/business/{id}` - Reseñas de un negocio
- `GET /api/reviews/user/my-reviews` - Mis reseñas

### Viajes
- `POST /api/trips` - Crear viaje
- `GET /api/trips` - Mis viajes
- `GET /api/trips/{id}` - Obtener viaje
- `POST /api/trips/{id}/activities` - Agregar actividad al viaje

## Flujo de Registro

### Usuario/Negocio Unificado

1. El usuario accede a `/signup` (redirige a `/signup/client`)
2. Completa el formulario con:
   - Datos personales (nombre, email, contraseña, etc.)
   - **Checkbox "Registrarme como negocio"**
3. Si marca el checkbox, aparecen campos adicionales:
   - Nombre del negocio
   - Tipo de negocio (hotel, restaurant, activity, shop)
   - Dirección
   - Horarios
   - Rango de precios
   - Descripción
   - Categorías
4. El backend:
   - Crea el usuario en la colección `users`
   - Si es negocio, crea automáticamente el negocio en `businesses`
   - Vincula el usuario con su negocio mediante `business_id`
   - Retorna token JWT y datos del usuario

## Cambios Recientes

### ✅ Eliminación de Datos Mock
- Se eliminaron todas las cuentas hardcodeadas
- Los endpoints `/api/auth/*` ahora hacen proxy al backend FastAPI
- Todas las operaciones CRUD se conectan directamente a MongoDB

### ✅ IDs Correctos
- Todos los modelos incluyen el campo `id` (string) mapeado desde `_id` de MongoDB
- Los ObjectId se convierten automáticamente a strings en las respuestas

### ✅ Página Principal
- La ruta `/` (localhost:3000) ahora muestra el explorador de experiencias
- Incluye búsqueda, filtros y listado de actividades

## Desarrollo

### Verificar Conexión Backend

```bash
curl http://localhost:8000/docs
```

Esto abrirá la documentación interactiva de FastAPI (Swagger UI).

### Verificar Conexión MongoDB

```python
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.ExplorerHub
print(await db.list_collection_names())
```

## Solución de Problemas

### Error: "viajero@test no existe"
- **Causa**: Estaba usando datos mock en lugar de MongoDB
- **Solución**: Los endpoints ahora se conectan al backend real

### Error: "No se puede conectar al backend"
- Verificar que FastAPI esté corriendo en puerto 8000
- Verificar el archivo `.env.local` en el frontend

### Error: "No se puede conectar a MongoDB"
- Verificar que MongoDB esté corriendo
- Verificar la URL de conexión en `backend/.env`

## Scripts Útiles

```bash
# Frontend
npm run dev          # Desarrollo
npm run build        # Compilar para producción
npm run start        # Iniciar producción

# Backend
uvicorn main:app --reload              # Desarrollo
uvicorn main:app --host 0.0.0.0 --port 8000  # Producción
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
