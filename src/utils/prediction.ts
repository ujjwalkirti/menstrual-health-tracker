import { addDays, fromISODate, diffInDays } from './date';

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
