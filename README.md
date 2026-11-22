# Kambista API

API REST de un sistema de cambio de divisas **USD ⇄ PEN** con autenticación JWT y roles (`user` y `admin`).

Permite registrar usuarios e iniciar sesión, crear solicitudes de cambio calculadas con el tipo de cambio de SUNAT (que la API consulta y guarda cada 30 segundos) y consultar el historial de operaciones por rango de fechas.

Está construida con Node.js, Express, TypeScript y MongoDB, siguiendo Clean Architecture y DDD. El frontend que la consume está en el repositorio `kambista-fx-web`.

## Requisitos previos

- Node.js 20 o superior
- npm
- MongoDB, de cualquiera de estas formas:
  - con Docker (el repositorio incluye un `docker-compose.yml`)
  - instalado localmente
  - en MongoDB Atlas

## Cómo levantar el proyecto en local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea el archivo de variables de entorno a partir del ejemplo y cambia `JWT_SECRET` por un valor propio de al menos 32 caracteres:

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell: `Copy-Item .env.example .env`.

3. Levanta MongoDB. Con Docker:

   ```bash
   docker compose up -d
   ```

   Si usas una instancia local en el puerto 27017, no necesitas hacer nada más. Si usas Atlas, coloca su URI en `MONGODB_URI`.

4. Inicia la API:

   ```bash
   npm run dev
   ```

   La API queda disponible en `http://localhost:3000/v1` y su documentación Swagger en `http://localhost:3000/docs`.

5. Opcional, para probar el rol `admin`: promueve a un usuario ya registrado y vuelve a iniciar sesión con él.

   ```bash
   npm run admin:promote -- correo@ejemplo.com
   ```

## Variables de entorno

Se definen en el archivo `.env`. El archivo `.env.example` contiene todas con valores de ejemplo.

| Variable | Obligatoria | Valor por defecto | Descripción |
|----------|:-----------:|-------------------|-------------|
| `MONGODB_URI` | Sí | | URI de conexión a MongoDB |
| `JWT_SECRET` | Sí | | Clave para firmar los tokens (mínimo 32 caracteres) |
| `PORT` | No | `3000` | Puerto en el que escucha la API |
| `JWT_EXPIRES_IN_SECONDS` | No | `3600` | Vigencia del token de acceso, en segundos |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Orígenes permitidos para el frontend, separados por coma |
| `EXCHANGE_RATE_API_URL` | No | `https://api.apis.net.pe/v1/tipo-cambio-sunat` | Proveedor del tipo de cambio |
| `EXCHANGE_RATE_POLL_INTERVAL_MS` | No | `30000` | Intervalo entre consultas del tipo de cambio, en milisegundos |
| `EXCHANGE_RATE_POLLING_ENABLED` | No | `true` | `false` desactiva la consulta periódica del tipo de cambio |

## Cómo ejecutar las pruebas

Pruebas unitarias (no necesitan base de datos):

```bash
npm test
```

Pruebas de integración de extremo a extremo (usan una base MongoDB en memoria, así que no requieren tener MongoDB instalado; la primera ejecución descarga el binario y necesita conexión a internet):

```bash
npm run test:e2e
```
