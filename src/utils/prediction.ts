import { addDays, fromISODate, diffInDays } from './date';
import type { Cycle } from '../models/types';

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
