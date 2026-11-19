import { buildExchangeRate } from '../../../test/support/builders';
import { FIXED_NOW, FixedClock, SequentialIdGenerator } from '../../../test/support/common-doubles';
import { InMemoryExchangeRateRepository } from '../../../test/support/exchange-doubles';
import { InMemoryTransactionRepository } from '../../../test/support/transactions-doubles';
import { GetLatestExchangeRate } from '../../exchange-rate/application/get-latest-exchange-rate';
import { ExchangeRateNotAvailableError } from '../../exchange-rate/domain/exchange-rate.errors';
import { Currency } from '../domain/currency';
import { InvalidAmountError, SameCurrencyError } from '../domain/transactions.errors';
import { CreateTransaction } from './create-transaction';

const command = {
  userId: 'user-1',
  sourceCurrency: Currency.USD,
  targetCurrency: Currency.PEN,
  amount: 100,
};

const setup = async ({ withRate = true } = {}) => {
  const rates = new InMemoryExchangeRateRepository();
  if (withRate) {
    await rates.save(buildExchangeRate());
  }
  const transactions = new InMemoryTransactionRepository();
  const createTransaction = new CreateTransaction(
    new GetLatestExchangeRate(rates),
    transactions,
    new SequentialIdGenerator(),
    new FixedClock(),
  );
  return { rates, transactions, createTransaction };
};

describe('CreateTransaction', () => {
  it('converts USD to PEN with the sell rate and persists the operation', async () => {
    const { transactions, createTransaction } = await setup();

    const transaction = await createTransaction.execute(command);

    expect(transaction).toMatchObject({
      id: 'id-1',
      userId: 'user-1',
      sourceCurrency: Currency.USD,
      targetCurrency: Currency.PEN,
      createdAt: FIXED_NOW,
    });
    expect(transaction.convertedAmount.toNumber()).toBe(373.9);
    expect(transaction.rate.toNumber()).toBe(3.739);
    expect(transactions.items).toEqual([transaction]);
  });

  it('converts PEN to USD with the buy rate', async () => {
    const { createTransaction } = await setup();

    const transaction = await createTransaction.execute({
      ...command,
      sourceCurrency: Currency.PEN,
      targetCurrency: Currency.USD,
    });

    expect(transaction.convertedAmount.toNumber()).toBe(26.79);
    expect(transaction.rate.toNumber()).toBe(3.733);
  });

  it('uses the most recent stored rate', async () => {
    const { rates, createTransaction } = await setup();
    await rates.save(
      buildExchangeRate({
        id: 'rate-2',
        sell: buildExchangeRate().sell.plus('0.1'),
        fetchedAt: new Date('2026-11-18T14:59:59Z'),
      }),
    );

    const transaction = await createTransaction.execute(command);

    expect(transaction.rate.toNumber()).toBe(3.839);
  });

  it('refuses to operate when there is no exchange rate', async () => {
    const { transactions, createTransaction } = await setup({ withRate: false });

    await expect(createTransaction.execute(command)).rejects.toThrow(ExchangeRateNotAvailableError);
    expect(transactions.items).toHaveLength(0);
  });

  it('refuses identical currencies without persisting', async () => {
    const { transactions, createTransaction } = await setup();

    await expect(
      createTransaction.execute({ ...command, targetCurrency: Currency.USD }),
    ).rejects.toThrow(SameCurrencyError);
    expect(transactions.items).toHaveLength(0);
  });

  it('refuses an amount that is not greater than zero', async () => {
    const { transactions, createTransaction } = await setup();

    await expect(createTransaction.execute({ ...command, amount: 0 })).rejects.toThrow(
      InvalidAmountError,
    );
    expect(transactions.items).toHaveLength(0);
  });
});
