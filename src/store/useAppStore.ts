import { create } from 'zustand';
import { Settings, Cycle, DailyLog, DEFAULT_SETTINGS } from '../models/types';
import { getItem, setItem, clearAll, KEYS } from '../utils/storage';

interface AppState {
  settings: Settings;
  cycles: Cycle[];
  logs: DailyLog[];
  hydrated: boolean;
  loadFromStorage: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  addCycle: (cycle: Cycle) => Promise<void>;
  updateCycle: (cycle: Cycle) => Promise<void>;
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
      settings: { ...DEFAULT_SETTINGS, lastPeriodStart: new Date().toISOString().split('T')[0] },
      cycles: [],
      logs: [],
      hydrated: false,
    });
  },
}));
