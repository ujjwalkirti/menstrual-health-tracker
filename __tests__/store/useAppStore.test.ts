import { useAppStore } from '../../src/store/useAppStore';

beforeEach(async () => {
  await useAppStore.getState().resetAll();
});

describe('startPeriod', () => {
  it('creates an active cycle and updates lastPeriodStart', async () => {
    await useAppStore.getState().startPeriod('2024-01-01');
    const { cycles, settings } = useAppStore.getState();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].startDate).toBe('2024-01-01');
    expect(cycles[0].endDate).toBeUndefined();
    expect(settings.lastPeriodStart).toBe('2024-01-01');
  });

  it('backfills the previous cycle length on the next start', async () => {
    const store = useAppStore.getState();
    await store.startPeriod('2024-01-01');
    await store.endPeriod('2024-01-05');
    await store.startPeriod('2024-01-29'); // 28 days after first start
    const cycles = useAppStore.getState().cycles;
    expect(cycles).toHaveLength(2);
    expect(cycles[0].cycleLength).toBe(28);
  });

  it('is idempotent-safe: a second start closes the dangling open cycle', async () => {
    const store = useAppStore.getState();
    await store.startPeriod('2024-01-01');
    await store.startPeriod('2024-01-29'); // no endPeriod between
    const cycles = useAppStore.getState().cycles;
    expect(cycles).toHaveLength(2);
    expect(cycles[0].cycleLength).toBe(28); // first still gets its length
  });
});

describe('endPeriod', () => {
  it('sets endDate on the active cycle', async () => {
    const store = useAppStore.getState();
    await store.startPeriod('2024-01-01');
    await store.endPeriod('2024-01-04');
    expect(useAppStore.getState().cycles[0].endDate).toBe('2024-01-04');
  });

  it('does nothing when there is no active cycle', async () => {
    await useAppStore.getState().endPeriod('2024-01-04');
    expect(useAppStore.getState().cycles).toHaveLength(0);
  });
});
