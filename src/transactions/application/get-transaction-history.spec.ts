import { buildTransaction } from '../../../test/support/builders';
import { InMemoryTransactionRepository } from '../../../test/support/transactions-doubles';
import { Role } from '../../shared/domain/role';
import { InvalidDateRangeError } from '../domain/transactions.errors';
import { GetTransactionHistory } from './get-transaction-history';

const user = { id: 'user-1', role: Role.User };
const admin = { id: 'admin-1', role: Role.Admin };
const period = { startDate: '2026-11-01', endDate: '2026-11-30' };

const setup = async () => {
  const transactions = new InMemoryTransactionRepository();
  await transactions.save(
    buildTransaction({ id: 'mine-old', createdAt: new Date('2026-11-05T15:00:00Z') }),
  );
  await transactions.save(
    buildTransaction({ id: 'mine-new', createdAt: new Date('2026-11-20T15:00:00Z') }),
  );
  await transactions.save(
    buildTransaction({ id: 'mine-october', createdAt: new Date('2026-10-20T15:00:00Z') }),
  );
  await transactions.save(
    buildTransaction({
      id: 'other',
      userId: 'user-2',
      createdAt: new Date('2026-11-10T15:00:00Z'),
    }),
  );
  await transactions.save(
    buildTransaction({
      id: 'admin-own',
      userId: 'admin-1',
      createdAt: new Date('2026-11-12T15:00:00Z'),
    }),
  );
  return { getTransactionHistory: new GetTransactionHistory(transactions) };
};

const idsOf = (items: { id: string }[]) => items.map((item) => item.id);

describe('GetTransactionHistory', () => {
  it('returns the requester operations inside the range, newest first', async () => {
    const { getTransactionHistory } = await setup();

    const history = await getTransactionHistory.execute({ requester: user, ...period });

    expect(idsOf(history)).toEqual(['mine-new', 'mine-old']);
  });

  it('ignores the userId filter when the requester is a regular user', async () => {
    const { getTransactionHistory } = await setup();

    const history = await getTransactionHistory.execute({
      requester: user,
      ...period,
      userId: 'user-2',
    });

    expect(idsOf(history)).toEqual(['mine-new', 'mine-old']);
  });

  it('lets an admin inspect any user', async () => {
    const { getTransactionHistory } = await setup();

    const history = await getTransactionHistory.execute({
      requester: admin,
      ...period,
      userId: 'user-2',
    });

    expect(idsOf(history)).toEqual(['other']);
  });

  it('shows an admin their own operations when no userId is given', async () => {
    const { getTransactionHistory } = await setup();

    const history = await getTransactionHistory.execute({ requester: admin, ...period });

    expect(idsOf(history)).toEqual(['admin-own']);
  });

  it('rejects an invalid range', async () => {
    const { getTransactionHistory } = await setup();

    await expect(
      getTransactionHistory.execute({
        requester: user,
        startDate: '2026-12-01',
        endDate: '2026-11-01',
      }),
    ).rejects.toThrow(InvalidDateRangeError);
  });
});
