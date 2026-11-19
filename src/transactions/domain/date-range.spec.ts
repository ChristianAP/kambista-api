import { DateRange } from './date-range';
import { InvalidDateRangeError } from './transactions.errors';

describe('DateRange', () => {
  it('covers whole days in Lima time, endpoints included', () => {
    const range = DateRange.between('2026-11-01', '2026-11-02');

    expect(range.from.toISOString()).toBe('2026-11-01T05:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-11-03T04:59:59.999Z');
  });

  it('accepts a single day', () => {
    const range = DateRange.between('2026-11-18', '2026-11-18');

    expect(range.to.getTime() - range.from.getTime()).toBe(24 * 60 * 60 * 1000 - 1);
  });

  it('rejects a start date after the end date', () => {
    expect(() => DateRange.between('2026-11-10', '2026-11-09')).toThrow('no puede ser posterior');
  });

  it.each(['', '2026/11/01', '2026-11-1', '18-11-2026', '2026-02-31', '2026-13-01'])(
    'rejects the invalid date "%s"',
    (value) => {
      expect(() => DateRange.between(value, '2026-12-01')).toThrow(InvalidDateRangeError);
      expect(() => DateRange.between('2026-01-01', value)).toThrow(InvalidDateRangeError);
    },
  );
});
