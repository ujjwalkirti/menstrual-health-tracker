import { addDays, fromISODate, diffInDays } from './date';
import type { Cycle } from '../models/types';
import type { Settings } from '../models/types';

export function calculateNextPeriod(lastPeriodStart: string, cycleLength: number): Date {
  return addDays(fromISODate(lastPeriodStart), cycleLength);
}

export function calculateOvulation(nextPeriod: Date): Date {
  return addDays(nextPeriod, -14);
}

export function getFertileWindow(ovulation: Date): { start: Date; end: Date } {
  return {
    start: addDays(ovulation, -2),
    end: addDays(ovulation, 2),
  };
}

export function getCurrentCycleDay(lastPeriodStart: string): number {
  const start = fromISODate(lastPeriodStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return diffInDays(start, today) + 1;
}

export function getDaysUntilNextPeriod(lastPeriodStart: string, cycleLength: number): number {
  const nextPeriod = calculateNextPeriod(lastPeriodStart, cycleLength);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return diffInDays(today, nextPeriod);
}

/**
 * Returns the named phase for a given cycle day.
 * ovulationDay = cycleLength - 14
 * fertileWindow = ovulationDay ± 2 (excluding ovulation day itself)
 */
export function getCurrentPhase(
  cycleDay: number,
  cycleLength: number,
  periodDuration: number,
): string {
  const ovulationDay = cycleLength - 14;
  if (cycleDay <= periodDuration) return 'Period';
  if (cycleDay === ovulationDay) return 'Ovulation';
  if (cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay + 2) return 'Fertile Window';
  if (cycleDay < ovulationDay - 2) return 'Follicular';
  return 'Luteal';
}

export function getActiveCycle(cycles: Cycle[]): Cycle | null {
  const open = cycles.filter((c) => !c.endDate);
  if (open.length === 0) return null;
  return open.reduce((latest, c) =>
    c.startDate > latest.startDate ? c : latest,
  );
}

const MIN_CYCLES_FOR_ADAPTIVE = 3;
const ROLLING_WINDOW = 6;

function average(values: number[]): number {
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

export function getEffectiveCycleLength(cycles: Cycle[], settings: Settings): number {
  const lengths = cycles
    .filter((c) => typeof c.cycleLength === 'number')
    .map((c) => c.cycleLength as number);
  if (lengths.length < MIN_CYCLES_FOR_ADAPTIVE) return settings.cycleLength;
  return average(lengths.slice(-ROLLING_WINDOW));
}

export function getEffectivePeriodDuration(cycles: Cycle[], settings: Settings): number {
  const durations = cycles
    .filter((c) => c.startDate && c.endDate)
    .map((c) => diffInDays(fromISODate(c.startDate), fromISODate(c.endDate as string)) + 1);
  if (durations.length < MIN_CYCLES_FOR_ADAPTIVE) return settings.periodDuration;
  return average(durations.slice(-ROLLING_WINDOW));
}
