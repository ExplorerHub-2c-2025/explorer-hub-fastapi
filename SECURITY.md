# Configuración de Variables de Entorno

## ⚠️ IMPORTANTE - Seguridad

**NUNCA** subas el archivo `.env` al repositorio. Este archivo contiene credenciales sensibles como:
- URL de conexión a MongoDB con usuario y contraseña
- Claves secretas JWT
- Otras configuraciones sensibles

## Configuración Inicial

1. Copia el archivo de ejemplo:
   ```bash
   cd explorerhub/backend
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus credenciales reales:
   ```bash
   # MongoDB Configuration
   MONGODB_URL=mongodb+srv://tu-usuario:tu-password@tu-cluster.mongodb.net/
   DATABASE_NAME=ExplorerHub
   
   # JWT Configuration (genera una clave segura)
   JWT_SECRET_KEY=tu-clave-super-secreta-generada-aleatoriamente
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # CORS Origins
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

3. Para generar una clave JWT segura, puedes usar:
   ```bash
   openssl rand -hex 32
   ```

## Variables Requeridas

### MongoDB
- `MONGODB_URL`: URL de conexión a tu base de datos MongoDB (local o Atlas)
- `DATABASE_NAME`: Nombre de la base de datos (por defecto: ExplorerHub)

### JWT (Autenticación)
- `JWT_SECRET_KEY`: Clave secreta para firmar los tokens JWT
- `JWT_ALGORITHM`: Algoritmo de encriptación (por defecto: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Tiempo de expiración de tokens en minutos (por defecto: 30)

### CORS
- `CORS_ORIGINS`: Orígenes permitidos para CORS (separados por comas)

## Verificación

El archivo `.gitignore` ya está configurado para ignorar archivos `.env*` (excepto `.env.example`).

Para verificar que tu `.env` no se subirá:
```bash
git status
# El archivo .env NO debe aparecer en la lista
```

## Rotación de Credenciales

Si accidentalmente expusiste credenciales:

1. **MongoDB Atlas**:
   - Ve a tu cluster en MongoDB Atlas
   - Security → Database Access
   - Cambia la contraseña del usuario
   - Actualiza el `.env` con la nueva contraseña

2. **JWT Secret**:
   - Genera una nueva clave: `openssl rand -hex 32`
   - Actualiza `JWT_SECRET_KEY` en `.env`
   - Nota: Esto invalidará todos los tokens existentes

3. **Commit y Push**:
   ```bash
   git add .
   git commit -m "Security: Move credentials to .env"
   git push
   ```

## Despliegue en Producción

Para producción (Vercel, Railway, etc.):
1. **NO** uses el archivo `.env`
2. Configura las variables de entorno en el panel de tu servicio de hosting
3. Usa valores diferentes y más seguros que en desarrollo
