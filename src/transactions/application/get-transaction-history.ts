import { AuthenticatedUser } from '../../shared/domain/authenticated-user';
import { Role } from '../../shared/domain/role';
import { DateRange } from '../domain/date-range';
import { Transaction } from '../domain/transaction';
import { TransactionRepository } from './transaction.repository';

export interface GetTransactionHistoryQuery {
  readonly requester: AuthenticatedUser;
  readonly startDate: string;
  readonly endDate: string;
  readonly userId?: string;
}

export class GetTransactionHistory {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(query: GetTransactionHistoryQuery): Promise<Transaction[]> {
    return this.transactions.findByCriteria({
      userId: this.resolveOwner(query),
      range: DateRange.between(query.startDate, query.endDate),
    });
  }

  private resolveOwner({ requester, userId }: GetTransactionHistoryQuery): string {
    const canInspectOthers = requester.role === Role.Admin;
    return canInspectOthers && userId ? userId : requester.id;
  }
}
