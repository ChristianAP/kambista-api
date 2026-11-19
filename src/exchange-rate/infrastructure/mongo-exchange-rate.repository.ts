import { Model } from 'mongoose';
import { fromDecimal128, toDecimal128 } from '../../shared/infrastructure/decimal-codec';
import { ExchangeRateRepository } from '../application/exchange-rate.repository';
import { ExchangeRate } from '../domain/exchange-rate';
import { ExchangeRateRecord } from './exchange-rate.model';

const toRecord = (rate: ExchangeRate): ExchangeRateRecord => ({
  _id: rate.id,
  buy: toDecimal128(rate.buy),
  sell: toDecimal128(rate.sell),
  source: rate.source,
  quotedOn: rate.quotedOn,
  fetchedAt: rate.fetchedAt,
});

const toEntity = (record: ExchangeRateRecord): ExchangeRate =>
  ExchangeRate.restore({
    id: record._id,
    buy: fromDecimal128(record.buy),
    sell: fromDecimal128(record.sell),
    source: record.source,
    quotedOn: record.quotedOn,
    fetchedAt: record.fetchedAt,
  });

export class MongoExchangeRateRepository implements ExchangeRateRepository {
  constructor(private readonly model: Model<ExchangeRateRecord>) {}

  async save(rate: ExchangeRate): Promise<void> {
    await this.model.replaceOne({ _id: rate.id }, toRecord(rate), { upsert: true });
  }

  async findLatest(): Promise<ExchangeRate | null> {
    const record = await this.model.findOne().sort({ fetchedAt: -1 }).lean<ExchangeRateRecord>();
    return record ? toEntity(record) : null;
  }
}
