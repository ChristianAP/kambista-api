import { InvalidDateRangeError } from './transactions.errors';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LIMA_UTC_OFFSET = '-05:00';
const START_OF_DAY = '00:00:00.000';
const END_OF_DAY = '23:59:59.999';

const isCalendarDate = (value: string): boolean => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T${START_OF_DAY}Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const toLimaInstant = (value: string, time: string): Date => {
  if (!isCalendarDate(value)) {
    throw new InvalidDateRangeError(`La fecha "${value}" no es válida, usa el formato AAAA-MM-DD`);
  }

  return new Date(`${value}T${time}${LIMA_UTC_OFFSET}`);
};

export class DateRange {
  private constructor(
    readonly from: Date,
    readonly to: Date,
  ) {}

  static between(startDate: string, endDate: string): DateRange {
    const from = toLimaInstant(startDate, START_OF_DAY);
    const to = toLimaInstant(endDate, END_OF_DAY);

    if (from.getTime() > to.getTime()) {
      throw new InvalidDateRangeError('La fecha inicial no puede ser posterior a la fecha final');
    }

    return new DateRange(from, to);
  }
}
