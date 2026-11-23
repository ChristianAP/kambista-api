import { z } from 'zod';
import {
  loginBody,
  loginResponse,
  refreshBody,
  registerBody,
  userResponse,
} from '../identity/presentation/auth.schemas';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../shared/domain/pagination';
import { apiErrorSchema } from '../shared/presentation/api-error.schema';
import {
  createTransactionBody,
  transactionResponse,
} from '../transactions/presentation/transactions.schemas';

type SchemaMode = 'input' | 'output';

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Datos de entrada inválidos',
  401: 'Token ausente o inválido, o credenciales incorrectas',
  409: 'Conflicto con el estado actual de los datos',
  422: 'La solicitud incumple una regla de negocio',
  429: 'Demasiados intentos fallidos, se informa el tiempo de espera en el header Retry-After',
  503: 'Servicio temporalmente no disponible',
};

const paginationHeader = (description: string) => ({
  description,
  schema: { type: 'integer' },
});

const historyResponseHeaders = {
  'X-Total-Count': paginationHeader('Total de operaciones que cumplen el filtro'),
  'X-Page': paginationHeader('Página devuelta'),
  'X-Limit': paginationHeader('Cantidad máxima de operaciones por página'),
  'X-Total-Pages': paginationHeader('Total de páginas disponibles'),
};

const jsonSchema = (schema: z.ZodType, mode: SchemaMode = 'output') => {
  const { $schema, ...definition } = z.toJSONSchema(schema, { io: mode });
  return definition;
};

const requestBody = (schema: z.ZodType) => ({
  required: true,
  content: { 'application/json': { schema: jsonSchema(schema, 'input') } },
});

const success = (description: string, schema: z.ZodType) => ({
  description,
  content: { 'application/json': { schema: jsonSchema(schema) } },
});

const errors = (...statuses: number[]) =>
  Object.fromEntries(
    statuses.map((status) => [
      String(status),
      {
        description: ERROR_DESCRIPTIONS[status],
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
    ]),
  );

const historyParameters = [
  {
    name: 'startDate',
    in: 'query',
    required: true,
    description: 'Inicio del rango, inclusive (zona horaria de Lima)',
    schema: { type: 'string', format: 'date', examples: ['2026-11-01'] },
  },
  {
    name: 'endDate',
    in: 'query',
    required: true,
    description: 'Fin del rango, inclusive (zona horaria de Lima)',
    schema: { type: 'string', format: 'date', examples: ['2026-11-30'] },
  },
  {
    name: 'userId',
    in: 'query',
    required: false,
    description: 'Solo para admin. Un usuario con rol user siempre consulta su propio historial',
    schema: { type: 'string' },
  },
  {
    name: 'page',
    in: 'query',
    required: false,
    description: 'Número de página, empezando en 1',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    required: false,
    description: 'Operaciones por página',
    schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE },
  },
];

const protectedRoute = [{ bearerAuth: [] }];

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Kambista FX API',
    version: '1.0.0',
    description:
      'API de cambio de divisas USD/PEN con autenticación JWT, roles y tipo de cambio de SUNAT.',
  },
  tags: [{ name: 'Autenticación' }, { name: 'Transacciones' }, { name: 'Salud' }],
  paths: {
    '/v1/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registra un usuario nuevo con rol user',
        requestBody: requestBody(registerBody),
        responses: {
          201: success('Usuario creado', userResponse),
          ...errors(400, 409),
        },
      },
    },
    '/v1/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Inicia sesión y devuelve un access_token JWT y un refresh_token',
        requestBody: requestBody(loginBody),
        responses: {
          200: success('Sesión iniciada', loginResponse),
          ...errors(400, 401, 429),
        },
      },
    },
    '/v1/auth/refresh': {
      post: {
        tags: ['Autenticación'],
        summary: 'Renueva la sesión con un refresh_token y lo rota',
        requestBody: requestBody(refreshBody),
        responses: {
          200: success(
            'Sesión renovada, el refresh_token anterior deja de ser válido',
            loginResponse,
          ),
          ...errors(400, 401),
        },
      },
    },
    '/v1/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cierra la sesión revocando el refresh_token',
        requestBody: requestBody(refreshBody),
        responses: {
          204: { description: 'Sesión cerrada' },
          ...errors(400),
        },
      },
    },
    '/v1/transactions': {
      post: {
        tags: ['Transacciones'],
        summary: 'Crea una solicitud de cambio con el último tipo de cambio guardado',
        security: protectedRoute,
        requestBody: requestBody(createTransactionBody),
        responses: {
          201: success('Operación registrada', transactionResponse),
          ...errors(400, 401, 422, 503),
        },
      },
    },
    '/v1/transactions/history': {
      get: {
        tags: ['Transacciones'],
        summary: 'Consulta el historial de cambios dentro de un rango de fechas, paginado',
        security: protectedRoute,
        parameters: historyParameters,
        responses: {
          200: {
            ...success(
              'Operaciones de la página, de la más reciente a la más antigua',
              z.array(transactionResponse),
            ),
            headers: historyResponseHeaders,
          },
          ...errors(400, 401, 422),
        },
      },
    },
    '/health': {
      get: {
        tags: ['Salud'],
        summary: 'Estado del servicio y de la base de datos',
        responses: {
          200: success(
            'Servicio en ejecución',
            z.object({ status: z.literal('ok'), database: z.enum(['up', 'down']) }),
          ),
        },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: { ApiError: jsonSchema(apiErrorSchema) },
  },
};
