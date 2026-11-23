# Kambista API

API REST de un sistema de cambio de divisas USD y PEN con autenticación JWT y roles (`user` y `admin`).

Permite registrar usuarios e iniciar sesión, crear solicitudes de cambio calculadas con el tipo de cambio de SUNAT (que la API consulta y guarda cada 30 segundos) y consultar el historial de operaciones por rango de fechas. Está hecha con Node.js, Express, TypeScript y MongoDB. El frontend que la consume está en el repositorio `kambista-fx-web`.

## Requisitos previos

- Node.js 20.19 o superior
- npm
- MongoDB, de cualquiera de estas formas:
  - con Docker, el repositorio incluye un `docker-compose.yml`
  - instalado localmente
  - embebido, con `npm run db:local` (descarga el binario la primera vez, útil si no tienes Docker)
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

   Queda disponible en `http://localhost:3000/v1` y la documentación Swagger en `http://localhost:3000/docs`.

5. Opcional, para probar el rol `admin`: promueve a un usuario ya registrado y vuelve a iniciar sesión con él.

   ```bash
   npm run admin:promote -- correo@ejemplo.com
   ```

## Variables de entorno

Se definen en `.env`. El archivo `.env.example` trae todas con valores de ejemplo.

| Variable | Obligatoria | Valor por defecto | Descripción |
|----------|:-----------:|-------------------|-------------|
| `MONGODB_URI` | Sí | | URI de conexión a MongoDB |
| `JWT_SECRET` | Sí | | Clave para firmar los tokens (mínimo 32 caracteres) |
| `PORT` | No | `3000` | Puerto en el que escucha la API |
| `JWT_EXPIRES_IN_SECONDS` | No | `900` | Vigencia del access token |
| `REFRESH_TOKEN_EXPIRES_IN_SECONDS` | No | `604800` | Vigencia del refresh token (7 días) |
| `LOGIN_MAX_FAILED_ATTEMPTS` | No | `10` | Intentos fallidos de login permitidos por IP dentro de la ventana |
| `LOGIN_ATTEMPTS_WINDOW_SECONDS` | No | `900` | Duración de la ventana del límite de login |
| `LOG_LEVEL` | No | `info` | `info`, `warn`, `error` o `silent` |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Orígenes permitidos para el frontend, separados por coma |
| `EXCHANGE_RATE_API_URL` | No | `https://api.apis.net.pe/v1/tipo-cambio-sunat` | Proveedor del tipo de cambio |
| `EXCHANGE_RATE_POLL_INTERVAL_MS` | No | `30000` | Intervalo entre consultas del tipo de cambio |
| `EXCHANGE_RATE_POLLING_ENABLED` | No | `true` | `false` desactiva la consulta periódica |

## Cómo ejecutar las pruebas

Unitarias, no necesitan base de datos:

```bash
npm test
```

De integración de extremo a extremo, usan una base MongoDB en memoria (la primera vez descarga el binario y necesita internet). Incluyen el flujo completo de registro, login, cambio e historial:

```bash
npm run test:e2e
```

Ambas juntas, con cobertura:

```bash
npm run test:cov
```

## Endpoints

El detalle de cada uno, con ejemplos y errores, está en Swagger (`/docs`).

| Método | Ruta | Acceso |
|--------|------|--------|
| `POST` | `/v1/auth/register` | Público |
| `POST` | `/v1/auth/login` | Público, con límite de intentos fallidos |
| `POST` | `/v1/auth/refresh` | Público, rota el refresh token |
| `POST` | `/v1/auth/logout` | Público, revoca el refresh token |
| `POST` | `/v1/transactions` | Autenticado |
| `GET` | `/v1/transactions/history` | Autenticado, paginado |
| `GET` | `/health` | Público |

## Decisiones de diseño

**Clean Architecture y DDD por módulo.** Separé `identity`, `exchange-rate` y `transactions`, cada uno con `domain`, `application`, `infrastructure` y `presentation`. Las dependencias apuntan hacia adentro y lo dejé forzado con una regla de ESLint: `domain` y `application` no pueden importar Express, Mongoose ni ninguna librería de infraestructura. Los casos de uso reciben sus puertos por constructor y el cableado vive en `container.ts`, sin un contenedor de inyección externo porque para este tamaño no lo necesitaba.

**Dinero con `decimal.js` y `Decimal128`.** Con `number` el cálculo de un monto puede arrastrar errores de punto flotante. El redondeo a 2 decimales (mitad hacia arriba) está en el dominio (`Money`) y los montos se guardan como `Decimal128`.

**Tipo de cambio.** El poller encadena `setTimeout` en lugar de usar `setInterval`, así dos consultas nunca se solapan si el proveedor tarda. Si una consulta falla, lo registro y sigo usando la última guardada. Cada lectura se guarda con un TTL de 7 días para que la colección no crezca sin límite. Para no consultar Mongo en cada transacción, un decorador del repositorio mantiene la última tasa en memoria y la actualiza al guardar.

**Sesión con access token corto y refresh token rotativo.** El access token es un JWT de 15 minutos. El refresh token es aleatorio (256 bits) y lo guardo como hash SHA-256, no en claro. Uso SHA-256 y no bcrypt porque el token ya tiene entropía suficiente y necesito buscarlo por su hash. Cada refresh invalida el token anterior, y si llega uno ya usado se revoca toda la sesión, porque eso indica que alguien lo copió. Las contraseñas sí van con bcrypt, y el login responde igual si el correo no existe o la contraseña es incorrecta.

**Límite de intentos en el login.** Cuento solo los intentos fallidos, 10 por IP cada 15 minutos. Lo limité por IP y no por cuenta para que un tercero no pueda bloquear a un usuario real fallando a propósito.

**Historial paginado.** Dejé el cuerpo como un array, como pide el enunciado, y puse la paginación en cabeceras (`X-Total-Count`, `X-Page`, `X-Limit`, `X-Total-Pages`), un enfoque parecido al de GitLab. Las fechas del rango se interpretan en hora de Lima, porque ahí operan los usuarios y "hoy" debe ser el día de Lima.

**Errores.** Los errores de negocio extienden `DomainError` y un único manejador los traduce a HTTP con un código estable (`SAME_CURRENCY`, `EXCHANGE_RATE_NOT_AVAILABLE`, etc.). El formato inválido responde 400 y las reglas de negocio 422.

**Logs.** Una línea JSON por evento. Cada petición registra `requestId`, método, ruta, estado, duración y usuario, y el nivel depende del estado de la respuesta.

## Límites conocidos

El límite de login y la caché del tipo de cambio viven en la memoria del proceso. Con más de una instancia habría que moverlos a Redis. El límite por IP tampoco frena un ataque distribuido, para eso añadiría bloqueo por cuenta con espera progresiva.
