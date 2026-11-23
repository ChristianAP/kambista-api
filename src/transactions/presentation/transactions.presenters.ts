import { Page } from '../../shared/domain/pagination';
import { Transaction } from '../domain/transaction';
import { TransactionResponse } from './transactions.schemas';

export const PAGINATION_HEADERS = {
  total: 'X-Total-Count',
  page: 'X-Page',
  limit: 'X-Limit',
  totalPages: 'X-Total-Pages',
} as const;

export const toTransactionResponse = (transaction: Transaction): TransactionResponse => ({
  id: transaction.id,
  monedaOrigen: transaction.sourceCurrency,
  monedaDestino: transaction.targetCurrency,
  monto: transaction.amount.toNumber(),
  montoCambiado: transaction.convertedAmount.toNumber(),
  tipoCambio: transaction.rate.toNumber(),
  fecha: transaction.createdAt.toISOString(),
});

export const toPaginationHeaders = (page: Page<Transaction>): Record<string, string> => ({
  [PAGINATION_HEADERS.total]: String(page.total),
  [PAGINATION_HEADERS.page]: String(page.pagination.page),
  [PAGINATION_HEADERS.limit]: String(page.pagination.limit),
  [PAGINATION_HEADERS.totalPages]: String(page.totalPages),
});
