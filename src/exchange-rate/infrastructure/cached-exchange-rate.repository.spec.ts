import { buildExchangeRate } from '../../../test/support/builders';
import { InMemoryExchangeRateRepository } from '../../../test/support/exchange-doubles';
import { CachedExchangeRateRepository } from './cached-exchange-rate.repository';

const setup = () => {
  const source = new InMemoryExchangeRateRepository();
  const findLatest = jest.spyOn(source, 'findLatest');
  return { source, findLatest, cached: new CachedExchangeRateRepository(source) };
};

describe('CachedExchangeRateRepository', () => {
  it('returns nothing while no rate has been stored', async () => {
    const { cached } = setup();

    expect(await cached.findLatest()).toBeNull();
  });

  it('reads the source once and serves later reads from memory', async () => {
    const { source, cached, findLatest } = setup();
    const stored = buildExchangeRate({ id: 'stored' });
    await source.save(stored);

    expect(await cached.findLatest()).toBe(stored);
    expect(await cached.findLatest()).toBe(stored);
    expect(await cached.findLatest()).toBe(stored);

    expect(findLatest).toHaveBeenCalledTimes(1);
  });

  it('serves a freshly saved rate without reading the source', async () => {
    const { source, cached, findLatest } = setup();
    const fresh = buildExchangeRate({ id: 'fresh' });

    await cached.save(fresh);

    expect(await cached.findLatest()).toBe(fresh);
    expect(findLatest).not.toHaveBeenCalled();
    expect(source.items).toEqual([fresh]);
  });

  it('replaces the cached rate with a newer one', async () => {
    const { cached } = setup();
    await cached.save(
      buildExchangeRate({ id: 'old', fetchedAt: new Date('2026-11-18T10:00:00Z') }),
    );
    const newer = buildExchangeRate({ id: 'new', fetchedAt: new Date('2026-11-18T10:00:30Z') });

    await cached.save(newer);

    expect(await cached.findLatest()).toBe(newer);
  });

  it('never replaces the cached rate with an older one', async () => {
    const { cached } = setup();
    const current = buildExchangeRate({
      id: 'current',
      fetchedAt: new Date('2026-11-18T10:00:30Z'),
    });
    await cached.save(current);

    await cached.save(
      buildExchangeRate({ id: 'late', fetchedAt: new Date('2026-11-18T10:00:00Z') }),
    );

    expect(await cached.findLatest()).toBe(current);
  });
});
