import { GetLatestExchangeRate } from '../../exchange-rate/application/get-latest-exchange-rate';
import { Clock } from '../../shared/application/clock';
import { IdGenerator } from '../../shared/application/id-generator';
import { Currency } from '../domain/currency';
import { Money } from '../domain/money';
import { Transaction } from '../domain/transaction';
import { TransactionRepository } from './transaction.repository';

export interface CreateTransactionCommand {
  readonly userId: string;
  readonly sourceCurrency: Currency;
  readonly targetCurrency: Currency;
  readonly amount: number;
}

export class CreateTransaction {
  constructor(
    private readonly getLatestExchangeRate: GetLatestExchangeRate,
    private readonly transactions: TransactionRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<Transaction> {
    const amount = Money.of(command.amount);
    const rates = await this.getLatestExchangeRate.execute();

    const transaction = Transaction.exchange({
      id: this.ids.next(),
      userId: command.userId,
      sourceCurrency: command.sourceCurrency,
      targetCurrency: command.targetCurrency,
      amount,
      rates,
      createdAt: this.clock.now(),
    });

    await this.transactions.save(transaction);
    return transaction;
  }
}
