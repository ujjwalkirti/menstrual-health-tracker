import { getActiveCycle } from '../../src/utils/prediction';
import type { Cycle } from '../../src/models/types';

describe('getActiveCycle', () => {
  it('returns null when there are no cycles', () => {
    expect(getActiveCycle([])).toBeNull();
  });

  it('returns null when all cycles are completed', () => {
    const cycles: Cycle[] = [
      { id: 'a', startDate: '2024-01-01', endDate: '2024-01-05' },
    ];
    expect(getActiveCycle(cycles)).toBeNull();
  });

  it('returns the cycle without an endDate', () => {
    const cycles: Cycle[] = [
      { id: 'a', startDate: '2024-01-01', endDate: '2024-01-05' },
      { id: 'b', startDate: '2024-01-29' },
    ];
    expect(getActiveCycle(cycles)?.id).toBe('b');
  });

  it('returns the latest active cycle when multiple lack endDate', () => {
    const cycles: Cycle[] = [
      { id: 'a', startDate: '2024-01-01' },
      { id: 'b', startDate: '2024-02-01' },
    ];
    expect(getActiveCycle(cycles)?.id).toBe('b');
  });
});

import {
  getEffectiveCycleLength,
  getEffectivePeriodDuration,
} from '../../src/utils/prediction';
import type { Settings } from '../../src/models/types';

const settings: Settings = {
  cycleLength: 28,
  periodDuration: 5,
  lastPeriodStart: '2024-01-01',
  hasOnboarded: true,
};

describe('getEffectiveCycleLength', () => {
  it('falls back to settings when fewer than 3 completed cycles', () => {
    const cycles: Cycle[] = [
      { id: 'a', startDate: '2024-01-01', endDate: '2024-01-05', cycleLength: 30 },
      { id: 'b', startDate: '2024-01-31', endDate: '2024-02-04', cycleLength: 30 },
    ];
    expect(getEffectiveCycleLength(cycles, settings)).toBe(28);
  });

  it('averages completed cycle lengths when 3+ exist', () => {
    const cycles: Cycle[] = [
      { id: 'a', startDate: '2024-01-01', endDate: '2024-01-05', cycleLength: 26 },
      { id: 'b', startDate: '2024-01-27', endDate: '2024-01-31', cycleLength: 26 },
      { id: 'c', startDate: '2024-02-22', endDate: '2024-02-26', cycleLength: 28 },
    ];
    // (26 + 26 + 28) / 3 = 26.67 -> rounds to 27
    expect(getEffectiveCycleLength(cycles, settings)).toBe(27);
  });

  it('uses only the last 6 completed cycles', () => {
    const make = (n: number): Cycle => ({
      id: `c${n}`,
      startDate: `2024-01-0${n}`,
      cycleLength: n === 1 ? 100 : 28, // outlier in the 7th-from-last slot
    });
    const cycles: Cycle[] = [1, 2, 3, 4, 5, 6, 7].map(make);
    // last 6 are all 28 -> average 28, the 100 outlier is dropped
    expect(getEffectiveCycleLength(cycles, settings)).toBe(28);
  });
});

describe('getEffectivePeriodDuration', () => {
  it('falls back to settings when fewer than 3 completed cycles', () => {
    const cycles: Cycle[] = [
      { id: 'a', startDate: '2024-01-01', endDate: '2024-01-03' },
    ];
    expect(getEffectivePeriodDuration(cycles, settings)).toBe(5);
  });

  it('averages inclusive durations when 3+ completed cycles exist', () => {
    const cycles: Cycle[] = [
      { id: 'a', startDate: '2024-01-01', endDate: '2024-01-03' }, // 3 days inclusive
      { id: 'b', startDate: '2024-01-27', endDate: '2024-01-29' }, // 3 days
      { id: 'c', startDate: '2024-02-22', endDate: '2024-02-25' }, // 4 days
    ];
    // (3 + 3 + 4) / 3 = 3.33 -> rounds to 3
    expect(getEffectivePeriodDuration(cycles, settings)).toBe(3);
  });
});

import { classifyCycle } from '../../src/utils/prediction';

describe('classifyCycle', () => {
  it('returns normal within tolerance', () => {
    expect(classifyCycle(28, 28)).toEqual({ delta: 0, tone: 'normal' });
    expect(classifyCycle(29, 28).tone).toBe('normal'); // within ±1
  });

  it('returns short when actual is meaningfully below effective', () => {
    expect(classifyCycle(25, 28)).toEqual({ delta: -3, tone: 'short' });
  });

  it('returns long when actual is meaningfully above effective', () => {
    expect(classifyCycle(32, 28)).toEqual({ delta: 4, tone: 'long' });
  });

  it('flags out-of-range cycle lengths', () => {
    expect(classifyCycle(19, 28).tone).toBe('flagged');
    expect(classifyCycle(37, 28).tone).toBe('flagged');
  });

  it('flags out-of-range durations with kind=duration', () => {
    expect(classifyCycle(1, 5, 'duration').tone).toBe('flagged');
    expect(classifyCycle(9, 5, 'duration').tone).toBe('flagged');
  });

  it('does not flag in-range durations', () => {
    expect(classifyCycle(3, 5, 'duration').tone).toBe('short');
  });
});
