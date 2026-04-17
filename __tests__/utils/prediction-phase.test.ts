import { getCurrentPhase } from '../../src/utils/prediction';

describe('getCurrentPhase', () => {
  // cycleLength=28, periodDuration=5, ovulationDay=14

  it('returns "Period" during period days', () => {
    expect(getCurrentPhase(1, 28, 5)).toBe('Period');
    expect(getCurrentPhase(5, 28, 5)).toBe('Period');
  });

  it('returns "Follicular" after period before fertile window', () => {
    expect(getCurrentPhase(6, 28, 5)).toBe('Follicular');
    expect(getCurrentPhase(11, 28, 5)).toBe('Follicular');
  });

  it('returns "Fertile Window" for days around ovulation', () => {
    expect(getCurrentPhase(12, 28, 5)).toBe('Fertile Window');
    expect(getCurrentPhase(13, 28, 5)).toBe('Fertile Window');
    expect(getCurrentPhase(15, 28, 5)).toBe('Fertile Window');
    expect(getCurrentPhase(16, 28, 5)).toBe('Fertile Window');
  });

  it('returns "Ovulation" on ovulation day', () => {
    expect(getCurrentPhase(14, 28, 5)).toBe('Ovulation');
  });

  it('returns "Luteal" after ovulation', () => {
    expect(getCurrentPhase(17, 28, 5)).toBe('Luteal');
    expect(getCurrentPhase(28, 28, 5)).toBe('Luteal');
  });
});
