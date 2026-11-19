import { DateRange } from '../domain/date-range';
import { Transaction } from '../domain/transaction';

export interface HistoryCriteria {
  readonly userId: string;
  readonly range: DateRange;
}

export abstract class TransactionRepository {
  abstract save(transaction: Transaction): Promise<void>;
  abstract findByCriteria(criteria: HistoryCriteria): Promise<Transaction[]>;
}
