import {
  toISODate,
  fromISODate,
  addDays,
  diffInDays,
  formatShort,
  formatFull,
  formatHeader,
  formatMonthYear,
} from '../../src/utils/date';

describe('date utils', () => {
  describe('toISODate', () => {
    it('formats a Date as YYYY-MM-DD', () => {
      const d = new Date('2024-03-15T12:00:00Z');
      expect(toISODate(d)).toBe('2024-03-15');
    });
  });

  describe('fromISODate', () => {
    it('parses YYYY-MM-DD into a local midnight Date', () => {
      const d = fromISODate('2024-03-15');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(15);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      expect(toISODate(addDays(fromISODate('2024-01-01'), 10))).toBe('2024-01-11');
    });

    it('subtracts days when negative', () => {
      expect(toISODate(addDays(fromISODate('2024-01-15'), -5))).toBe('2024-01-10');
    });

    it('crosses month boundaries', () => {
      expect(toISODate(addDays(fromISODate('2024-01-29'), 5))).toBe('2024-02-03');
    });
  });

  describe('diffInDays', () => {
    it('returns full days between two dates (b - a)', () => {
      expect(diffInDays(fromISODate('2024-01-01'), fromISODate('2024-01-11'))).toBe(10);
    });

    it('returns negative when b is before a', () => {
      expect(diffInDays(fromISODate('2024-01-11'), fromISODate('2024-01-01'))).toBe(-10);
    });
  });

  describe('formatShort', () => {
    it('returns month abbreviation and day number', () => {
      const result = formatShort('2024-03-15');
      expect(result).toContain('Mar');
      expect(result).toContain('15');
    });
  });

  describe('formatFull', () => {
    it('returns full month, day and year', () => {
      const result = formatFull('2024-03-15');
      expect(result).toContain('March');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatHeader', () => {
    it('returns weekday, full month and day', () => {
      // 2024-03-15 is a Friday
      const result = formatHeader('2024-03-15');
      expect(result).toContain('Friday');
      expect(result).toContain('March');
      expect(result).toContain('15');
    });
  });

  describe('formatMonthYear', () => {
    it('returns full month and year', () => {
      const result = formatMonthYear('2024-03-15');
      expect(result).toContain('March');
      expect(result).toContain('2024');
    });
  });
});
