export type Settings = {
  cycleLength: number;
  periodDuration: number;
  lastPeriodStart: string; // ISO date string: YYYY-MM-DD
  hasOnboarded: boolean;
};

export type Cycle = {
  id: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
};

export type DailyLog = {
  id: string;
  date: string; // ISO date string
  mood?: string;
  symptoms?: string[];
  flow?: 'light' | 'medium' | 'heavy';
  notes?: string;
};

export const DEFAULT_SETTINGS: Settings = {
  cycleLength: 28,
  periodDuration: 5,
  lastPeriodStart: new Date().toISOString().split('T')[0],
  hasOnboarded: false,
};
