import { Decimal } from 'decimal.js';
import { Currency } from './currency';
import { ConversionRates, convert } from './exchange-calculator';
import { Money } from './money';

export interface TransactionProps {
  readonly id: string;
  readonly userId: string;
  readonly sourceCurrency: Currency;
  readonly targetCurrency: Currency;
  readonly amount: Money;
  readonly convertedAmount: Money;
  readonly rate: Decimal;
  readonly createdAt: Date;
}

export interface ExchangeRequest extends Omit<TransactionProps, 'convertedAmount' | 'rate'> {
  readonly rates: ConversionRates;
}

export class Transaction {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly sourceCurrency: Currency,
    readonly targetCurrency: Currency,
    readonly amount: Money,
    readonly convertedAmount: Money,
    readonly rate: Decimal,
    readonly createdAt: Date,
  ) {}

  static exchange({ rates, ...request }: ExchangeRequest): Transaction {
    const { convertedAmount, appliedRate } = convert(
      request.amount,
      request.sourceCurrency,
      request.targetCurrency,
      rates,
    );

    return Transaction.restore({ ...request, convertedAmount, rate: appliedRate });
  }

  static restore(props: TransactionProps): Transaction {
    return new Transaction(
      props.id,
      props.userId,
      props.sourceCurrency,
      props.targetCurrency,
      props.amount,
      props.convertedAmount,
      props.rate,
      props.createdAt,
    );
  }
}
