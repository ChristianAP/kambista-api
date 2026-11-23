import { Model } from 'mongoose';
import { Page, toPage } from '../../shared/domain/pagination';
import { fromDecimal128, toDecimal128 } from '../../shared/infrastructure/decimal-codec';
import { HistoryCriteria, TransactionRepository } from '../application/transaction.repository';
import { Money } from '../domain/money';
import { Transaction } from '../domain/transaction';
import { TransactionRecord } from './transaction.model';

const toRecord = (transaction: Transaction): TransactionRecord => ({
  _id: transaction.id,
  userId: transaction.userId,
  sourceCurrency: transaction.sourceCurrency,
  targetCurrency: transaction.targetCurrency,
  amount: toDecimal128(transaction.amount.toDecimal()),
  convertedAmount: toDecimal128(transaction.convertedAmount.toDecimal()),
  rate: toDecimal128(transaction.rate),
  createdAt: transaction.createdAt,
});

const toEntity = (record: TransactionRecord): Transaction =>
  Transaction.restore({
    id: record._id,
    userId: record.userId,
    sourceCurrency: record.sourceCurrency,
    targetCurrency: record.targetCurrency,
    amount: Money.fromDecimal(fromDecimal128(record.amount)),
    convertedAmount: Money.fromDecimal(fromDecimal128(record.convertedAmount)),
    rate: fromDecimal128(record.rate),
    createdAt: record.createdAt,
  });

export class MongoTransactionRepository implements TransactionRepository {
  constructor(private readonly model: Model<TransactionRecord>) {}

  async save(transaction: Transaction): Promise<void> {
    await this.model.replaceOne({ _id: transaction.id }, toRecord(transaction), { upsert: true });
  }

  async findByCriteria({ userId, range, pagination }: HistoryCriteria): Promise<Page<Transaction>> {
    const filter = { userId, createdAt: { $gte: range.from, $lte: range.to } };

    const [records, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.offset)
        .limit(pagination.limit)
        .lean<TransactionRecord[]>(),
      this.model.countDocuments(filter),
    ]);

    return toPage(records.map(toEntity), total, pagination);
  }
}
