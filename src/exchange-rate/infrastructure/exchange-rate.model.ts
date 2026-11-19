import { model, Schema, Types } from 'mongoose';

const RETENTION_SECONDS = 7 * 24 * 60 * 60;

export interface ExchangeRateRecord {
  _id: string;
  buy: Types.Decimal128;
  sell: Types.Decimal128;
  source: string;
  quotedOn: string;
  fetchedAt: Date;
}

const exchangeRateSchema = new Schema<ExchangeRateRecord>(
  {
    _id: { type: String, required: true },
    buy: { type: Schema.Types.Decimal128, required: true },
    sell: { type: Schema.Types.Decimal128, required: true },
    source: { type: String, required: true },
    quotedOn: { type: String, required: true },
    fetchedAt: { type: Date, required: true },
  },
  { collection: 'exchange_rates', versionKey: false },
);

exchangeRateSchema.index({ fetchedAt: -1 }, { expireAfterSeconds: RETENTION_SECONDS });

export const ExchangeRateModel = model<ExchangeRateRecord>('ExchangeRate', exchangeRateSchema);
