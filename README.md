# Kambista API

API REST para un sistema de cambio de divisas **USD ⇄ PEN** con autenticación de usuarios, construida con **Node.js, Express y TypeScript**.

Permite registrarse, iniciar sesión, crear solicitudes de cambio calculadas con el tipo de cambio de SUNAT y consultar el historial de operaciones. El tipo de cambio se descarga y se guarda automáticamente cada 30 segundos.

El frontend que consume esta API está en el repositorio `kambista-fx-web`.

## Tabla de contenidos

1. [Qué hace el sistema](#qué-hace-el-sistema)
2. [Stack tecnológico](#stack-tecnológico)
3. [Requisitos previos](#requisitos-previos)
4. [Puesta en marcha paso a paso](#puesta-en-marcha-paso-a-paso)
5. [Variables de entorno](#variables-de-entorno)
6. [Crear un usuario administrador](#crear-un-usuario-administrador)
7. [Referencia de la API](#referencia-de-la-api)
8. [Reglas de negocio](#reglas-de-negocio)
9. [Arquitectura](#arquitectura)
10. [Cómo viaja una petición por Express](#cómo-viaja-una-petición-por-express)
11. [Decisiones de diseño](#decisiones-de-diseño)
12. [Pruebas](#pruebas)
13. [Scripts disponibles](#scripts-disponibles)
14. [Limitaciones conocidas](#limitaciones-conocidas)

## Qué hace el sistema

| Capacidad | Descripción |
|-----------|-------------|
| Registro e inicio de sesión | Contraseñas con hash bcrypt y sesión mediante token JWT |
| Roles | `user` opera y consulta solo su historial. `admin` puede consultar el historial de cualquier usuario |
| Tipo de cambio | Se consulta a SUNAT cada 30 segundos y se guarda. La operación usa siempre el último guardado |
| Solicitudes de cambio | USD → PEN multiplica por el precio de venta. PEN → USD divide entre el precio de compra |
| Historial | Operaciones filtradas por rango de fechas, de la más reciente a la más antigua |
| Documentación | Swagger interactivo en `/docs` |

## Stack tecnológico

| Área | Tecnología |
|------|-----------|
| Lenguaje | Node.js 20+ con TypeScript |
| Servidor HTTP | Express 5 |
| Base de datos | MongoDB con Mongoose |
| Validación | Zod, en la entrada HTTP y en las variables de entorno |
| Autenticación | `jsonwebtoken` (JWT) y `bcryptjs` |
| Seguridad HTTP | `helmet` y `cors` |
| Dinero | `decimal.js` para cálculos exactos y `Decimal128` para persistirlos |
| Documentación | OpenAPI 3.1 servida con `swagger-ui-express` |
| Pruebas | Jest, Supertest y `mongodb-memory-server` |
| Arquitectura | Clean Architecture + DDD |

## Requisitos previos

- **Node.js 20 o superior** y **npm**.
- **Una instancia de MongoDB.** Elige la opción que prefieras:

| Opción | Cuándo usarla | Cómo |
|--------|---------------|------|
| Docker | Ya tienes Docker | `docker compose up -d` |
| MongoDB instalado | Ya tienes MongoDB Community | Déjalo corriendo en el puerto 27017 |
| MongoDB embebido | No tienes Docker ni MongoDB | `npm run db:local` (descarga el binario la primera vez) |
| MongoDB Atlas | Prefieres la nube | Crea un clúster gratuito y copia su URI en `MONGODB_URI` |

## Puesta en marcha paso a paso

1. **Instala las dependencias**

   ```bash
   npm install
   ```

2. **Crea tu archivo de variables de entorno**

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell usa `Copy-Item .env.example .env`. Cambia `JWT_SECRET` por un valor propio de al menos 32 caracteres.

3. **Levanta MongoDB** con una de las opciones de la tabla anterior. Por ejemplo, con Docker:

   ```bash
   docker compose up -d
   ```

4. **Inicia la API en modo desarrollo**

   ```bash
   npm run dev
   ```

5. **Comprueba que funciona**
   - API: `http://localhost:3000/v1`
   - Estado del servicio: `http://localhost:3000/health`
   - Documentación Swagger: `http://localhost:3000/docs`

   En el log verás una línea como `Tipo de cambio actualizado: compra 3.426 / venta 3.433` cada 30 segundos. Hasta que se guarde la primera lectura, crear un cambio responde `503 EXCHANGE_RATE_NOT_AVAILABLE`.

Para ejecutar la versión compilada:

```bash
npm run build
npm start
```

## Variables de entorno

Todas se validan al arrancar con Zod. Si falta alguna obligatoria o tiene un formato incorrecto, la aplicación no inicia y explica qué corregir.

| Variable | Obligatoria | Valor por defecto | Descripción |
|----------|:-----------:|-------------------|-------------|
| `MONGODB_URI` | Sí | | URI de conexión a MongoDB |
| `JWT_SECRET` | Sí | | Secreto para firmar los tokens (mínimo 32 caracteres) |
| `PORT` | No | `3000` | Puerto HTTP |
| `JWT_EXPIRES_IN_SECONDS` | No | `3600` | Vigencia del access token en segundos |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Orígenes permitidos separados por coma |
| `EXCHANGE_RATE_API_URL` | No | `https://api.apis.net.pe/v1/tipo-cambio-sunat` | Proveedor del tipo de cambio |
| `EXCHANGE_RATE_POLL_INTERVAL_MS` | No | `30000` | Intervalo entre consultas al proveedor |
| `EXCHANGE_RATE_POLLING_ENABLED` | No | `true` | `false` desactiva la consulta periódica |

## Crear un usuario administrador

Todo usuario nuevo nace con el rol `user`. El rol `admin` no se puede pedir desde la API: se asigna desde la base de datos. Para hacerlo sin escribir consultas, el proyecto incluye un comando que promueve a un usuario ya registrado:

```bash
npm run admin:promote -- juan@example.com
```

El usuario debe volver a iniciar sesión para recibir un token con el nuevo rol.

## Referencia de la API

Todas las rutas de negocio llevan el prefijo `/v1` y, salvo registro y login, exigen el header:

```
Authorization: Bearer <access_token>
```

La documentación interactiva con todos los esquemas está en `http://localhost:3000/docs`.

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/v1/auth/register` | Público | Registra un usuario con rol `user` |
| `POST` | `/v1/auth/login` | Público | Devuelve el `access_token` y los datos del usuario |
| `POST` | `/v1/transactions` | Autenticado | Crea una solicitud de cambio |
| `GET` | `/v1/transactions/history` | Autenticado | Historial por rango de fechas |
| `GET` | `/health` | Público | Estado del servicio y de la base de datos |

### Registro

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","email":"juan@example.com","password":"contraseña123"}'
```

Respuesta `201`:

```json
{
  "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "rol": "user"
}
```

La contraseña debe tener entre 8 y 72 caracteres y el nombre entre 2 y 100. Cualquier campo `rol` enviado por el cliente se ignora.

### Inicio de sesión

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"contraseña123"}'
```

Respuesta `200`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "user"
  }
}
```

Un correo inexistente y una contraseña incorrecta devuelven exactamente la misma respuesta `401`, para no revelar qué correos están registrados.

### Crear una solicitud de cambio

```bash
curl -X POST http://localhost:3000/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monedaOrigen":"USD","monedaDestino":"PEN","monto":100}'
```

Respuesta `201`:

```json
{
  "id": "5b8c2d3e-7f10-4c55-9a6e-1d2f3a4b5c6d",
  "monedaOrigen": "USD",
  "monedaDestino": "PEN",
  "monto": 100,
  "montoCambiado": 373.9,
  "tipoCambio": 3.739,
  "fecha": "2026-11-18T15:00:00.000Z"
}
```

`tipoCambio` es el valor que realmente se aplicó: `venta` para USD → PEN y `compra` para PEN → USD.

### Consultar el historial

```bash
curl "http://localhost:3000/v1/transactions/history?startDate=2026-11-01&endDate=2026-11-30" \
  -H "Authorization: Bearer $TOKEN"
```

| Parámetro | Requerido | Descripción |
|-----------|:---------:|-------------|
| `startDate` | Sí | Inicio del rango, formato `AAAA-MM-DD`, inclusive |
| `endDate` | Sí | Fin del rango, formato `AAAA-MM-DD`, inclusive |
| `userId` | No | Solo lo respeta el rol `admin`. Sin este parámetro, el admin ve su propio historial. Un usuario `user` siempre ve el suyo |

Respuesta `200`: un arreglo con el mismo formato de la creación, de la operación más reciente a la más antigua.

### Formato de errores

Todos los errores comparten la misma estructura y un `code` estable que se puede usar para decidir qué mostrar:

```json
{
  "statusCode": 422,
  "code": "SAME_CURRENCY",
  "message": "La moneda de origen y la de destino no pueden ser iguales",
  "path": "/v1/transactions",
  "timestamp": "2026-11-18T15:00:00.000Z"
}
```

Los errores de validación de la entrada incluyen además `details`, con el campo y el mensaje de cada problema.

| Estado | Cuándo ocurre | Códigos |
|:------:|---------------|---------|
| `400` | La solicitud no tiene el formato esperado | `VALIDATION_ERROR`, `INVALID_JSON` |
| `401` | Token ausente, inválido o expirado, o credenciales incorrectas | `MISSING_TOKEN`, `INVALID_TOKEN`, `INVALID_CREDENTIALS` |
| `404` | La ruta no existe | `ROUTE_NOT_FOUND` |
| `409` | El correo ya está registrado | `EMAIL_ALREADY_REGISTERED` |
| `422` | Se incumple una regla de negocio | `SAME_CURRENCY`, `INVALID_AMOUNT`, `AMOUNT_EXCEEDS_LIMIT`, `AMOUNT_TOO_SMALL`, `INVALID_DATE_RANGE`, `INVALID_EMAIL` |
| `503` | Todavía no hay un tipo de cambio guardado | `EXCHANGE_RATE_NOT_AVAILABLE` |

## Reglas de negocio

- **Cálculo.** USD → PEN: `monto × venta`. PEN → USD: `monto ÷ compra`. El resultado se redondea a 2 decimales (mitad hacia arriba).
- **Monto.** Mayor a cero, máximo 2 decimales y máximo `9,999,999.99`. El frontend aplica los mismos límites, pero el backend los valida siempre.
- **Monedas.** Solo `USD` y `PEN`, y deben ser distintas.
- **Resultado cero.** Si el monto es tan pequeño que el resultado redondeado sería `0.00`, la operación se rechaza.
- **Tipo de cambio.** Cada operación guarda la tasa que usó, de modo que el historial no cambia cuando cambia el tipo de cambio.
- **Fechas.** El rango se interpreta en la zona horaria de Lima (UTC-5). `endDate` incluye el día completo.
- **Roles.** El rol viaja dentro del token. Si un usuario es promovido a `admin`, debe iniciar sesión otra vez.

## Arquitectura

El proyecto es un monolito modular. Cada contexto de negocio tiene sus propias capas y nada del núcleo conoce a Express, Mongoose ni HTTP.

### Contextos

| Contexto | Responsabilidad |
|----------|-----------------|
| `identity` | Usuarios, registro, login, tokens y rol |
| `exchange-rate` | Obtener el tipo de cambio del proveedor y guardarlo |
| `transactions` | Dinero, cálculo del cambio, solicitudes e historial |
| `shared` | Núcleo compartido: errores de dominio, reloj, generador de ids, manejo de errores HTTP |

### Capas dentro de cada contexto

```
presentation   Routers de Express, esquemas Zod y respuestas HTTP
      │
infrastructure Mongoose, bcrypt, JWT, cliente HTTP del proveedor, planificador
      │
application    Casos de uso y puertos (contratos que infraestructura implementa)
      │
domain         Entidades, objetos de valor y reglas de negocio
```

La dependencia siempre apunta hacia adentro. `domain` no importa nada de las demás capas y `application` solo conoce `domain` y sus propios puertos. Esta regla está verificada automáticamente por ESLint (`npm run lint`): una importación indebida rompe la revisión de calidad.

### Estructura de carpetas

```
src/
├── main.ts               Arranque: configuración, base de datos, servidor y cierre ordenado
├── app.ts                Aplicación Express: middlewares y rutas, en orden
├── container.ts          Composition root: aquí se construyen y conectan todas las piezas
├── config/               Variables de entorno validadas con Zod
├── database/             Conexión a MongoDB
├── docs/                 Documento OpenAPI generado a partir de los esquemas Zod
├── health/               GET /health
├── cli/                  Comando para promover administradores
├── shared/
│   ├── domain/           DomainError y sus categorías, Role, AuthenticatedUser
│   ├── application/      Puertos Clock e IdGenerator
│   ├── infrastructure/   Reloj, UUID, logger, utilidades de Mongo
│   └── presentation/     Manejador de errores y formato de error de la API
├── identity/
│   ├── domain/           User, Email, errores
│   ├── application/      RegisterUser, LoginUser, PromoteUserToAdmin y puertos
│   ├── infrastructure/   Repositorio Mongo, bcrypt, JWT
│   └── presentation/     Router de auth, esquemas Zod, middleware authenticate
├── exchange-rate/
│   ├── domain/           ExchangeRate, errores
│   ├── application/      RefreshExchangeRate, GetLatestExchangeRate y puertos
│   └── infrastructure/   Repositorio Mongo, cliente de apis.net.pe, ExchangeRatePoller
└── transactions/
    ├── domain/           Money, Currency, Transaction, DateRange, calculadora de cambio
    ├── application/      CreateTransaction, GetTransactionHistory y puerto
    ├── infrastructure/   Repositorio Mongo
    └── presentation/     Router de transacciones, esquemas Zod y presentadores
test/
├── support/              Dobles de prueba, builders y utilidades para E2E
└── *.e2e-spec.ts         Pruebas de extremo a extremo
```

### Inyección de dependencias sin framework

No hay contenedor mágico: [`container.ts`](src/container.ts) es una función que crea cada pieza con `new` y se la pasa a quien la necesita por el constructor.

```ts
const users = new MongoUserRepository(UserModel);
const registerUser = new RegisterUser(users, passwordHasher, ids, clock);
```

`app.ts` recibe ese contenedor y entrega a cada router solo los casos de uso que usa. Para las pruebas basta con construir el contenedor con otras piezas (por ejemplo, un proveedor de tipo de cambio falso).

## Cómo viaja una petición por Express

Los middlewares de `app.ts` se ejecutan **en el orden en que están escritos**:

| Orden | Middleware | Qué hace |
|:-----:|------------|----------|
| 1 | Swagger UI en `/docs` | Sirve la documentación antes de aplicar helmet, para que su política de seguridad de contenido no interfiera con los recursos de la interfaz |
| 2 | `helmet` | Añade cabeceras de seguridad y oculta `X-Powered-By` |
| 3 | `cors` | Permite solo los orígenes de `CORS_ORIGINS` |
| 4 | `express.json()` | Convierte el cuerpo JSON en `req.body` |
| 5 | `/health` y `/v1/auth` | Rutas públicas: se montan **antes** de exigir autenticación |
| 6 | `authenticate` | Valida el token y deja el usuario en `res.locals.user`. Todo lo que se monta después queda protegido |
| 7 | `/v1/transactions` | Rutas protegidas |
| 8 | `notFoundHandler` | Si nadie respondió, crea un error 404 |
| 9 | `errorHandler` | Convierte cualquier error en la respuesta JSON estándar |

Para crear un cambio, el recorrido es:

1. `authenticate` valida el token y guarda el usuario.
2. El handler de `POST /v1/transactions` valida el cuerpo con `createTransactionBody.parse(req.body)`. Si el formato es incorrecto, Zod lanza un error.
3. Llama al caso de uso `CreateTransaction`, que crea el `Money` (monto positivo y con 2 decimales), pide el último tipo de cambio y delega el cálculo en el dominio.
4. El repositorio guarda la operación y el handler responde `201` con el formato del contrato.
5. Si en cualquier punto se lanza un error, Express 5 lo reenvía automáticamente al `errorHandler`, incluso en funciones `async`.

## Decisiones de diseño

| Decisión | Motivo |
|----------|--------|
| **Express 5** | Reenvía automáticamente los errores de las funciones `async` al manejador de errores, así que los handlers no necesitan `try/catch` ni un envoltorio |
| **Zod para validar la entrada** | Un esquema valida, tipa el resultado (`z.infer`) y además alimenta la documentación OpenAPI. Una sola definición para tres usos |
| **Zod también para las variables de entorno** | La aplicación falla al arrancar y explica qué falta, en lugar de fallar más tarde de forma confusa |
| **La configuración se pasa como argumento** | `loadEnvironment(source)` no lee `process.env` por su cuenta. Las pruebas construyen la app con su propia configuración sin tocar el entorno global |
| **Dependencias construidas a mano** | El `container.ts` se lee de arriba abajo y no hay decoradores ni reflexión. Es fácil de explicar y de reemplazar en pruebas |
| **Rutas protegidas por orden de montaje** | Todo lo que se monta después de `authenticate` exige token. Una ruta nueva nace protegida y abrirla es una decisión visible |
| **Un solo manejador de errores** | Los errores de dominio se clasifican por tipo (entrada inválida, conflicto, no autenticado…) y un único punto los convierte a HTTP |
| **Reglas de monto en el dominio** | El esquema Zod solo valida el tipo. Los límites viven en `Money` y en la calculadora, sin duplicarlos |
| **Dinero con `decimal.js` y `Decimal128`** | `100 * 3.739` en coma flotante no es exacto. Se calcula y se guarda con precisión decimal y se redondea una sola vez |
| **Se guarda la tasa aplicada** | Una operación pasada nunca cambia aunque el tipo de cambio sí lo haga |
| **JWT con algoritmo fijo (HS256)** | Al verificar se acepta únicamente HS256, lo que impide tokens sin firma o firmados con otro algoritmo. Además se comprueba que el rol del token sea uno conocido |
| **Polling con `setTimeout` encadenado** | La siguiente consulta se agenda al terminar la anterior, por lo que nunca se solapan. Si el proveedor falla se registra una advertencia y se conserva la última tasa guardada |
| **Cada lectura se guarda** | Sigue el requisito de "obtener y guardar cada 30 s". Un índice TTL elimina las lecturas con más de 7 días |
| **Autenticación con mensaje único** | Evita revelar si un correo existe |
| **`bcryptjs`** | Implementa bcrypt en JavaScript puro: no requiere compilar módulos nativos en la máquina de quien revise |
| **Historial de un usuario inexistente devuelve lista vacía** | Evita un acoplamiento entre contextos solo para distinguir "no existe" de "no tiene operaciones" |

## Pruebas

```bash
npm test
```

Ejecuta las pruebas unitarias: dominio, casos de uso, configuración, manejo de errores, JWT, bcrypt y el planificador (con temporizadores simulados). Usan dobles en memoria, no necesitan base de datos y corren en segundos.

```bash
npm run test:e2e
```

Ejecuta las pruebas de extremo a extremo con Supertest sobre la aplicación completa y una base de datos MongoDB embebida (`mongodb-memory-server`). No hace falta tener MongoDB instalado, pero **la primera ejecución descarga el binario de MongoDB** y necesita conexión a internet. Cubren el flujo registro → login → cambio → historial, las reglas por rol y los errores de validación.

```bash
npm run test:cov    # unitarias con reporte de cobertura en coverage/
npm run test:all    # unitarias y E2E
npm run lint        # estilo y reglas de dependencia entre capas
```

## Scripts disponibles

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Inicia la API con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm run admin:promote -- <email>` | Promueve a un usuario a administrador |
| `npm run db:local` | Levanta un MongoDB embebido en el puerto 27017 |
| `npm test` · `npm run test:e2e` · `npm run test:all` · `npm run test:cov` | Pruebas |
| `npm run lint` · `npm run format` | Calidad y formato de código |

## Limitaciones conocidas

- La consulta del tipo de cambio corre dentro del proceso de la API. Con varias instancias, cada una consulta al proveedor (es seguro, pero redundante).
- No hay renovación de tokens: al expirar el access token hay que iniciar sesión otra vez.
- No hay límite de intentos de inicio de sesión.
- El historial devuelve todas las operaciones del rango, sin paginar.
- Los registros del servidor son líneas de texto con marca de tiempo, sin formato estructurado.
