import {
  calculateNextPeriod,
  calculateOvulation,
  getFertileWindow,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
} from '../../src/utils/prediction';
import { toISODate } from '../../src/utils/date';

describe('prediction utils', () => {
  const lastPeriodStart = '2024-01-01';
  const cycleLength = 28;

  describe('calculateNextPeriod', () => {
    it('returns lastPeriodStart + cycleLength days', () => {
      const result = calculateNextPeriod(lastPeriodStart, cycleLength);
      expect(toISODate(result)).toBe('2024-01-29');
    });

    it('handles cycle length of 30', () => {
      const result = calculateNextPeriod('2024-01-01', 30);
      expect(toISODate(result)).toBe('2024-01-31');
    });
  });

  describe('calculateOvulation', () => {
    it('is 14 days before next period', () => {
      const nextPeriod = calculateNextPeriod(lastPeriodStart, cycleLength);
      const result = calculateOvulation(nextPeriod);
      expect(toISODate(result)).toBe('2024-01-15');
    });
  });

  describe('getFertileWindow', () => {
    it('returns ovulation ± 2 days', () => {
      const nextPeriod = calculateNextPeriod(lastPeriodStart, cycleLength);
      const ovulation = calculateOvulation(nextPeriod);
      const { start, end } = getFertileWindow(ovulation);
      expect(toISODate(start)).toBe('2024-01-13');
      expect(toISODate(end)).toBe('2024-01-17');
    });
  });

  describe('getCurrentCycleDay', () => {
    it('returns 1 when last period started today', () => {
      const today = toISODate(new Date());
      expect(getCurrentCycleDay(today)).toBe(1);
    });

    it('returns correct day for a known past date', () => {
      // Fix "today" by mocking Date
      const realDate = global.Date;
      const mockNow = new Date('2024-01-15T12:00:00');
      global.Date = class extends realDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockNow.getTime());
          } else {
            // @ts-ignore
            super(...args);
          }
        }
        static now() { return mockNow.getTime(); }
      } as any;

      expect(getCurrentCycleDay('2024-01-01')).toBe(15);

      global.Date = realDate;
    });
  });

  describe('getDaysUntilNextPeriod', () => {
    it('returns cycleLength when called on the same day as lastPeriodStart', () => {
      const today = toISODate(new Date());
      const result = getDaysUntilNextPeriod(today, 28);
      expect(result).toBe(28);
    });
  });
});
