import { Clock } from '../../src/shared/application/clock';
import { IdGenerator } from '../../src/shared/application/id-generator';

export const FIXED_NOW = new Date('2026-11-18T15:00:00.000Z');

export class FixedClock implements Clock {
  constructor(private readonly current: Date = FIXED_NOW) {}

  now(): Date {
    return this.current;
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }
}
