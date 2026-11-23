import { model, Schema, Types } from 'mongoose';
import { Currency } from '../domain/currency';

export interface TransactionRecord {
  _id: string;
  userId: string;
  sourceCurrency: Currency;
  targetCurrency: Currency;
  amount: Types.Decimal128;
  convertedAmount: Types.Decimal128;
  rate: Types.Decimal128;
  createdAt: Date;
}

const transactionSchema = new Schema<TransactionRecord>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    sourceCurrency: { type: String, enum: Object.values(Currency), required: true },
    targetCurrency: { type: String, enum: Object.values(Currency), required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    convertedAmount: { type: Schema.Types.Decimal128, required: true },
    rate: { type: Schema.Types.Decimal128, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'transactions', versionKey: false },
);

transactionSchema.index({ userId: 1, createdAt: -1, _id: -1 });

export const TransactionModel = model<TransactionRecord>('Transaction', transactionSchema);
