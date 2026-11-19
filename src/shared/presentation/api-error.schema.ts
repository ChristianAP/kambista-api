import { z } from 'zod';

export const fieldErrorSchema = z.object({
  field: z.string().meta({ examples: ['monto'] }),
  message: z.string().meta({ examples: ['monto debe ser un número'] }),
});

export const apiErrorSchema = z.object({
  statusCode: z.number().meta({ examples: [422] }),
  code: z.string().meta({ examples: ['SAME_CURRENCY'] }),
  message: z
    .string()
    .meta({ examples: ['La moneda de origen y la de destino no pueden ser iguales'] }),
  details: z.array(fieldErrorSchema).optional(),
  path: z.string().meta({ examples: ['/v1/transactions'] }),
  timestamp: z.string().meta({ examples: ['2026-11-18T15:00:00.000Z'] }),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
