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
