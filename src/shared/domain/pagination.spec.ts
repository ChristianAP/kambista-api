import { InvalidPaginationError } from './pagination.errors';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Pagination, toPage } from './pagination';

describe('Pagination', () => {
  it('starts at the first page with the default size', () => {
    const pagination = Pagination.of();

    expect(pagination).toMatchObject({ page: 1, limit: DEFAULT_PAGE_SIZE });
    expect(pagination.offset).toBe(0);
  });

  it('skips the items of the previous pages', () => {
    expect(Pagination.of(3, 10).offset).toBe(20);
  });

  it('accepts the maximum page size', () => {
    expect(Pagination.of(1, MAX_PAGE_SIZE).limit).toBe(MAX_PAGE_SIZE);
  });

  it.each([
    ['page zero', 0, 10],
    ['a negative page', -1, 10],
    ['a fractional page', 1.5, 10],
    ['a zero limit', 1, 0],
    ['a fractional limit', 1, 2.5],
    ['a limit above the maximum', 1, MAX_PAGE_SIZE + 1],
    ['a page that is not a number', Number.NaN, 10],
  ])('rejects %s', (_description, page, limit) => {
    expect(() => Pagination.of(page, limit)).toThrow(InvalidPaginationError);
  });
});

describe('toPage', () => {
  it('computes how many pages the total needs', () => {
    expect(toPage(['a', 'b'], 45, Pagination.of(1, 20)).totalPages).toBe(3);
    expect(toPage(['a'], 40, Pagination.of(1, 20)).totalPages).toBe(2);
  });

  it('reports zero pages when there are no items', () => {
    expect(toPage([], 0, Pagination.of()).totalPages).toBe(0);
  });
});
