import { Page, toPage } from '../../src/shared/domain/pagination';
import {
  HistoryCriteria,
  TransactionRepository,
} from '../../src/transactions/application/transaction.repository';
import { Transaction } from '../../src/transactions/domain/transaction';

export class InMemoryTransactionRepository implements TransactionRepository {
  readonly items: Transaction[] = [];

  async save(transaction: Transaction): Promise<void> {
    this.items.push(transaction);
  }

  async findByCriteria({ userId, range, pagination }: HistoryCriteria): Promise<Page<Transaction>> {
    const matching = this.items
      .filter(
        (item) =>
          item.userId === userId &&
          item.createdAt.getTime() >= range.from.getTime() &&
          item.createdAt.getTime() <= range.to.getTime(),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return toPage(
      matching.slice(pagination.offset, pagination.offset + pagination.limit),
      matching.length,
      pagination,
    );
  }
}
