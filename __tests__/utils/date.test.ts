import { toISODate, fromISODate, addDays, diffInDays, formatDisplay } from '../../src/utils/date';

describe('date utils', () => {
  describe('toISODate', () => {
    it('formats a Date as YYYY-MM-DD', () => {
      // Use UTC to avoid timezone flakiness
      const d = new Date('2024-03-15T12:00:00Z');
      expect(toISODate(d)).toBe('2024-03-15');
    });
  });

  describe('fromISODate', () => {
    it('parses YYYY-MM-DD into a local midnight Date', () => {
      const d = fromISODate('2024-03-15');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(2); // 0-indexed
      expect(d.getDate()).toBe(15);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const result = addDays(fromISODate('2024-01-01'), 10);
      expect(toISODate(result)).toBe('2024-01-11');
    });

    it('subtracts days when negative', () => {
      const result = addDays(fromISODate('2024-01-15'), -5);
      expect(toISODate(result)).toBe('2024-01-10');
    });

    it('crosses month boundaries', () => {
      const result = addDays(fromISODate('2024-01-29'), 5);
      expect(toISODate(result)).toBe('2024-02-03');
    });
  });

  describe('diffInDays', () => {
    it('returns full days between two dates (b - a)', () => {
      const a = fromISODate('2024-01-01');
      const b = fromISODate('2024-01-11');
      expect(diffInDays(a, b)).toBe(10);
    });

    it('returns negative when b is before a', () => {
      const a = fromISODate('2024-01-11');
      const b = fromISODate('2024-01-01');
      expect(diffInDays(a, b)).toBe(-10);
    });
  });

  describe('formatDisplay', () => {
    it('returns a human-readable date string', () => {
      const result = formatDisplay('2024-03-15');
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });
  });
});
