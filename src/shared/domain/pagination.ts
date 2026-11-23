import { InvalidPaginationError } from './pagination.errors';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export class Pagination {
  private constructor(
    readonly page: number,
    readonly limit: number,
  ) {}

  static of(page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Pagination {
    if (!Number.isInteger(page) || page < 1) {
      throw new InvalidPaginationError('La página debe ser un entero mayor o igual a 1');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new InvalidPaginationError(`El límite debe ser un entero entre 1 y ${MAX_PAGE_SIZE}`);
    }

    return new Pagination(page, limit);
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly pagination: Pagination;
  readonly totalPages: number;
}

export const toPage = <T>(items: readonly T[], total: number, pagination: Pagination): Page<T> => ({
  items,
  total,
  pagination,
  totalPages: Math.ceil(total / pagination.limit),
});
