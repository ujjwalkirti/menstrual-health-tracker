import { classifyCycle } from './prediction';

export function buildStartMessage(actualLength: number, effectiveLength: number): string {
  const { delta, tone } = classifyCycle(actualLength, effectiveLength, 'length');
  if (tone === 'normal') return 'Right on schedule 🌸';
  const days = Math.abs(delta);
  if (delta < 0) {
    return `Your period came ${days} ${days === 1 ? 'day' : 'days'} early — that's completely normal. I've updated your predictions.`;
  }
  return `Your period is ${days} ${days === 1 ? 'day' : 'days'} later than expected. Cycles shift sometimes — predictions updated.`;
}

export function buildEndMessage(actualDuration: number, effectiveDuration: number): string {
  const { delta } = classifyCycle(actualDuration, effectiveDuration, 'duration');
  const word = delta < 0 ? 'shorter' : delta > 0 ? 'longer' : 'in line with';
  if (delta === 0) {
    return `This period lasted ${actualDuration} days — right in line with your usual ${effectiveDuration}. Totally normal.`;
  }
  return `This period lasted ${actualDuration} days — a little ${word} than your usual ${effectiveDuration}. Totally normal to vary.`;
}

export function buildFlagMessage(kind: 'length' | 'duration'): string {
  if (kind === 'duration') {
    return 'Your recent periods have been outside the typical 2–8 day range. This is often nothing, but it can be worth mentioning to a doctor at some point.';
  }
  return 'Your recent cycles have been outside the typical 21–35 day range. This is often nothing, but it can be worth mentioning to a doctor at some point.';
}
