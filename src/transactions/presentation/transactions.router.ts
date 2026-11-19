import { Router } from 'express';
import { currentUser } from '../../identity/presentation/authenticate';
import { CreateTransaction } from '../application/create-transaction';
import { GetTransactionHistory } from '../application/get-transaction-history';
import { toTransactionResponse } from './transactions.presenters';
import { createTransactionBody, historyQuery } from './transactions.schemas';

export interface TransactionsRouterDependencies {
  createTransaction: CreateTransaction;
  getTransactionHistory: GetTransactionHistory;
}

export const createTransactionsRouter = ({
  createTransaction,
  getTransactionHistory,
}: TransactionsRouterDependencies): Router => {
  const router = Router();

  router.post('/', async (req, res) => {
    const { monedaOrigen, monedaDestino, monto } = createTransactionBody.parse(req.body);
    const transaction = await createTransaction.execute({
      userId: currentUser(res).id,
      sourceCurrency: monedaOrigen,
      targetCurrency: monedaDestino,
      amount: monto,
    });
    res.status(201).json(toTransactionResponse(transaction));
  });

  router.get('/history', async (req, res) => {
    const query = historyQuery.parse(req.query);
    const transactions = await getTransactionHistory.execute({
      requester: currentUser(res),
      ...query,
    });
    res.json(transactions.map(toTransactionResponse));
  });

  return router;
};
