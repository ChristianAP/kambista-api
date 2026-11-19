import { z } from 'zod';
import { Currency } from '../domain/currency';
import { MAX_EXCHANGE_AMOUNT } from '../domain/exchange-calculator';

const OBJECT_MESSAGE = 'El cuerpo de la solicitud debe ser un objeto JSON';

const currencyField = (field: string, example: Currency) =>
  z
    .enum(Currency, `${field} debe ser una de estas monedas: ${Object.values(Currency).join(', ')}`)
    .meta({ examples: [example] });

const dateField = (field: string, description: string) =>
  z
    .string(`${field} es obligatorio (formato AAAA-MM-DD)`)
    .meta({ description, format: 'date', examples: ['2026-11-18'] });

export const createTransactionBody = z.object(
  {
    monedaOrigen: currencyField('monedaOrigen', Currency.USD),
    monedaDestino: currencyField('monedaDestino', Currency.PEN),
    monto: z
      .number('monto debe ser un número')
      .meta({ examples: [100], minimum: 0.01, maximum: MAX_EXCHANGE_AMOUNT }),
  },
  OBJECT_MESSAGE,
);

export const historyQuery = z.object({
  startDate: dateField('startDate', 'Inicio del rango, inclusive (zona horaria de Lima)'),
  endDate: dateField('endDate', 'Fin del rango, inclusive (zona horaria de Lima)'),
  userId: z.string('userId debe ser un texto').optional(),
});

export const transactionResponse = z.object({
  id: z.string().meta({ examples: ['5b8c2d3e-7f10-4c55-9a6e-1d2f3a4b5c6d'] }),
  monedaOrigen: z.enum(Currency),
  monedaDestino: z.enum(Currency),
  monto: z.number().meta({ examples: [100] }),
  montoCambiado: z.number().meta({ examples: [373.9] }),
  tipoCambio: z.number().meta({ examples: [3.739] }),
  fecha: z.string().meta({ examples: ['2026-11-18T15:00:00.000Z'] }),
});

export type TransactionResponse = z.infer<typeof transactionResponse>;
