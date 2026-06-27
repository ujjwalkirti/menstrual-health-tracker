import { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  calculateOvulation,
  getFertileWindow,
} from '../../src/utils/prediction';
import { toISODate, addDays, fromISODate } from '../../src/utils/date';
import { useTheme } from '../../src/theme';
import { CalendarView, type MarkedDates } from '../../src/components/CalendarView';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const cycles = useAppStore((s) => s.cycles);
  const logs = useAppStore((s) => s.logs);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};

    // Logged period days
    cycles.forEach((cycle) => {
      if (cycle.endDate) {
        let d = fromISODate(cycle.startDate);
        const end = fromISODate(cycle.endDate);
        while (d <= end) {
          marks[toISODate(d)] = { type: 'period' };
          d = addDays(d, 1);
        }
      }
    });

    // Predicted period
    const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
    for (let i = 0; i < settings.periodDuration; i++) {
      const key = toISODate(addDays(nextPeriod, i));
      if (!marks[key]) marks[key] = { type: 'predicted' };
    }

    // Fertile window
    const ovulation = calculateOvulation(nextPeriod);
    const fertile = getFertileWindow(ovulation);
    let fd = fertile.start;
    while (fd <= fertile.end) {
      const key = toISODate(fd);
      if (!marks[key]) marks[key] = { type: 'fertile' };
      fd = addDays(fd, 1);
    }

    // Ovulation (overwrites fertile if on same day)
    const ovKey = toISODate(ovulation);
    if (!marks[ovKey] || marks[ovKey].type === 'fertile') {
      marks[ovKey] = { type: 'ovulation' };
    }

    // Log dots
    logs.forEach((log) => {
      if (marks[log.date]) {
        marks[log.date] = { ...marks[log.date], hasLog: true };
      } else {
        marks[log.date] = { type: 'none', hasLog: true };
      }
    });

    return marks;
  }, [settings, cycles, logs]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CalendarView
        markedDates={markedDates}
        onDayPress={(dateStr) => router.push(`/log/${dateStr}`)}
      />
    </View>
  );
}
