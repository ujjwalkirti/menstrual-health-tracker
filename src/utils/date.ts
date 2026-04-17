export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODate(dateStr: string): Date {
  // Parse as local midnight to avoid UTC offset shifting the date
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function diffInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bUTC - aUTC) / MS_PER_DAY);
}

/** "Mar 15" */
export function formatShort(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** "March 15, 2024" */
export function formatFull(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Friday, March 15" */
export function formatHeader(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** "March 2024" */
export function formatMonthYear(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
