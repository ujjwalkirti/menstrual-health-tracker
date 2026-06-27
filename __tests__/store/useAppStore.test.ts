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

describe('undoStart', () => {
  it('removes the just-started cycle and restores lastPeriodStart', async () => {
    const store = useAppStore.getState();
    await store.startPeriod('2024-01-01');
    await store.endPeriod('2024-01-05');
    const beforeSecond = useAppStore.getState().settings.lastPeriodStart;
    await store.startPeriod('2024-01-29');
    await store.undoStart();
    const { cycles, settings } = useAppStore.getState();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].startDate).toBe('2024-01-01');
    expect(settings.lastPeriodStart).toBe(beforeSecond);
  });

  it('reverses the backfill applied to the previous cycle', async () => {
    const store = useAppStore.getState();
    await store.startPeriod('2024-01-01');
    await store.endPeriod('2024-01-05');
    await store.startPeriod('2024-01-29'); // backfills cycles[0].cycleLength = 28
    expect(useAppStore.getState().cycles[0].cycleLength).toBe(28);
    await store.undoStart();
    expect(useAppStore.getState().cycles[0].cycleLength).toBeUndefined();
  });

  it('does nothing when there is no start to undo', async () => {
    await useAppStore.getState().undoStart();
    expect(useAppStore.getState().cycles).toHaveLength(0);
  });

  it('only undoes the most recent start (single level)', async () => {
    const store = useAppStore.getState();
    await store.startPeriod('2024-01-01');
    await store.startPeriod('2024-01-29');
    await store.undoStart();
    await store.undoStart(); // second undo is a no-op
    const cycles = useAppStore.getState().cycles;
    expect(cycles).toHaveLength(1);
    expect(cycles[0].startDate).toBe('2024-01-01');
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
