import { z } from 'zod';

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).default(3000),
  MONGODB_URI: z
    .string('es obligatoria')
    .regex(/^mongodb(\+srv)?:\/\//, 'debe ser una URI de MongoDB válida'),
  JWT_SECRET: z.string('es obligatorio').min(32, 'debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).default(3600),
  LOG_LEVEL: z.enum(['info', 'warn', 'error', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  EXCHANGE_RATE_API_URL: z.url().default('https://api.apis.net.pe/v1/tipo-cambio-sunat'),
  EXCHANGE_RATE_POLL_INTERVAL_MS: z.coerce.number().int().min(1000).default(30_000),
  EXCHANGE_RATE_POLLING_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type Environment = z.infer<typeof environmentSchema>;

export const loadEnvironment = (source: NodeJS.ProcessEnv = process.env): Environment => {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues.map(
      ({ path, message }) => `- ${path.join('.')}: ${message}`,
    );
    throw new Error(`Configuración de entorno inválida:\n${problems.join('\n')}`);
  }

  return result.data;
};
