import { Decimal } from 'decimal.js';
import { ExchangeRate, ExchangeRateProps } from '../../src/exchange-rate/domain/exchange-rate';
import { Email } from '../../src/identity/domain/email';
import { User, UserProps } from '../../src/identity/domain/user';
import { Role } from '../../src/shared/domain/role';
import { Currency } from '../../src/transactions/domain/currency';
import { Money } from '../../src/transactions/domain/money';
import { Transaction, TransactionProps } from '../../src/transactions/domain/transaction';

export const buildUser = (overrides: Partial<UserProps> = {}): User =>
  User.restore({
    id: 'user-1',
    name: 'Juan Pérez',
    email: Email.of('juan@example.com'),
    passwordHash: 'hashed:contraseña123',
    role: Role.User,
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    ...overrides,
  });

export const buildExchangeRate = (overrides: Partial<ExchangeRateProps> = {}): ExchangeRate =>
  ExchangeRate.restore({
    id: 'rate-1',
    buy: new Decimal('3.733'),
    sell: new Decimal('3.739'),
    source: 'SUNAT',
    quotedOn: '2026-11-18',
    fetchedAt: new Date('2026-11-18T14:59:30.000Z'),
    ...overrides,
  });

export const buildTransaction = (overrides: Partial<TransactionProps> = {}): Transaction =>
  Transaction.restore({
    id: 'transaction-1',
    userId: 'user-1',
    sourceCurrency: Currency.USD,
    targetCurrency: Currency.PEN,
    amount: Money.of(100),
    convertedAmount: Money.of(373.9),
    rate: new Decimal('3.739'),
    createdAt: new Date('2026-11-18T15:00:00.000Z'),
    ...overrides,
  });
