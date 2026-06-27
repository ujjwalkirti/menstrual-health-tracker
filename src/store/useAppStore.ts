import { create } from 'zustand';
import { Settings, Cycle, DailyLog, DEFAULT_SETTINGS } from '../models/types';
import { getItem, setItem, clearAll, KEYS } from '../utils/storage';
import { getActiveCycle, calculateNextPeriod, getEffectiveCycleLength } from '../utils/prediction';
import { toISODate, fromISODate, diffInDays } from '../utils/date';

interface AppState {
  settings: Settings;
  cycles: Cycle[];
  logs: DailyLog[];
  hydrated: boolean;
  loadFromStorage: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  addCycle: (cycle: Cycle) => Promise<void>;
  updateCycle: (cycle: Cycle) => Promise<void>;
  startPeriod: (date: string) => Promise<void>;
  endPeriod: (date: string) => Promise<void>;
  addLog: (log: DailyLog) => Promise<void>;
  updateLog: (log: DailyLog) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  cycles: [],
  logs: [],
  hydrated: false,

  loadFromStorage: async () => {
    const [settings, cycles, logs] = await Promise.all([
      getItem<Settings>(KEYS.SETTINGS),
      getItem<Cycle[]>(KEYS.CYCLES),
      getItem<DailyLog[]>(KEYS.LOGS),
    ]);

    set({
      settings: settings ?? DEFAULT_SETTINGS,
      cycles: cycles ?? [],
      logs: logs ?? [],
      hydrated: true,
    });
  },

  updateSettings: async (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    await setItem(KEYS.SETTINGS, updated);
  },

  addCycle: async (cycle) => {
    const cycles = [...get().cycles, cycle];
    set({ cycles });
    await setItem(KEYS.CYCLES, cycles);
  },

  updateCycle: async (cycle) => {
    const cycles = get().cycles.map((c) => (c.id === cycle.id ? cycle : c));
    set({ cycles });
    await setItem(KEYS.CYCLES, cycles);
  },

  startPeriod: async (date) => {
    const state = get();
    const effectiveLength = getEffectiveCycleLength(state.cycles, state.settings);
    const predictedStartDate = toISODate(
      calculateNextPeriod(state.settings.lastPeriodStart, effectiveLength),
    );

    // Backfill the most recent prior cycle's start-to-start length.
    const cycles = state.cycles.map((c) => {
      const isLatestPrior =
        c.cycleLength === undefined &&
        c.startDate < date &&
        !state.cycles.some((o) => o.startDate > c.startDate && o.startDate < date);
      if (!isLatestPrior) return c;
      return {
        ...c,
        cycleLength: diffInDays(fromISODate(c.startDate), fromISODate(date)),
      };
    });

    const newCycle = {
      id: `${date}-${Date.now()}`,
      startDate: date,
      predictedStartDate,
    };

    const updatedSettings = { ...state.settings, lastPeriodStart: date };
    set({ cycles: [...cycles, newCycle], settings: updatedSettings });
    await setItem(KEYS.CYCLES, [...cycles, newCycle]);
    await setItem(KEYS.SETTINGS, updatedSettings);
  },

  endPeriod: async (date) => {
    const state = get();
    const active = getActiveCycle(state.cycles);
    if (!active) return;
    const cycles = state.cycles.map((c) =>
      c.id === active.id ? { ...c, endDate: date } : c,
    );
    set({ cycles });
    await setItem(KEYS.CYCLES, cycles);
  },

  addLog: async (log) => {
    const logs = [...get().logs, log];
    set({ logs });
    await setItem(KEYS.LOGS, logs);
  },

  updateLog: async (log) => {
    const logs = get().logs.map((l) => (l.id === log.id ? log : l));
    set({ logs });
    await setItem(KEYS.LOGS, logs);
  },

  deleteLog: async (id) => {
    const logs = get().logs.filter((l) => l.id !== id);
    set({ logs });
    await setItem(KEYS.LOGS, logs);
  },

  resetAll: async () => {
    await clearAll();
    set({
      settings: DEFAULT_SETTINGS,
      cycles: [],
      logs: [],
      hydrated: true,
    });
  },
}));
