import { Transaction } from '../domain/transaction';
import { TransactionResponse } from './transactions.schemas';

export const toTransactionResponse = (transaction: Transaction): TransactionResponse => ({
  id: transaction.id,
  monedaOrigen: transaction.sourceCurrency,
  monedaDestino: transaction.targetCurrency,
  monto: transaction.amount.toNumber(),
  montoCambiado: transaction.convertedAmount.toNumber(),
  tipoCambio: transaction.rate.toNumber(),
  fecha: transaction.createdAt.toISOString(),
});
