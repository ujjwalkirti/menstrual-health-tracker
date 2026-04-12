import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  calculateOvulation,
  getFertileWindow,
} from '../../src/utils/prediction';
import { toISODate, addDays, fromISODate } from '../../src/utils/date';

type DotMarking = {
  selected?: boolean;
  selectedColor?: string;
  marked?: boolean;
  dotColor?: string;
};

type MarkedDates = Record<string, DotMarking>;

export default function CalendarScreen() {
  const settings = useAppStore((s) => s.settings);
  const cycles = useAppStore((s) => s.cycles);
  const logs = useAppStore((s) => s.logs);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};

    // Logged period days (actual)
    cycles.forEach((cycle) => {
      let d = fromISODate(cycle.startDate);
      const end = fromISODate(cycle.endDate);
      while (d <= end) {
        marks[toISODate(d)] = { selected: true, selectedColor: '#E91E8C' };
        d = addDays(d, 1);
      }
    });

    // Predictions
    const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
    const ovulation = calculateOvulation(nextPeriod);
    const fertile = getFertileWindow(ovulation);

    // Predicted period days
    let pd = nextPeriod;
    for (let i = 0; i < settings.periodDuration; i++) {
      const key = toISODate(pd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#FFB6C1' };
      pd = addDays(pd, 1);
    }

    // Fertile window
    let fd = fertile.start;
    while (fd <= fertile.end) {
      const key = toISODate(fd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#C8E6C9' };
      fd = addDays(fd, 1);
    }

    // Ovulation (drawn after fertile window so it takes priority)
    const ovKey = toISODate(ovulation);
    if (!marks[ovKey]) marks[ovKey] = { selected: true, selectedColor: '#FFF176' };

    // Daily log dots — overlay on top of existing marks
    logs.forEach((log) => {
      marks[log.date] = {
        ...(marks[log.date] ?? {}),
        marked: true,
        dotColor: '#555',
      };
    });

    return marks;
  }, [settings, cycles, logs]);

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        markingType="simple"
        onDayPress={(day) => router.push(`/log/${day.dateString}`)}
        theme={{
          backgroundColor: '#FFF0F5',
          calendarBackground: '#FFF0F5',
          todayTextColor: '#E91E8C',
          arrowColor: '#E91E8C',
          monthTextColor: '#333',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
      />
      <View style={styles.legend}>
        <LegendItem color="#E91E8C" label="Period" />
        <LegendItem color="#FFB6C1" label="Predicted" />
        <LegendItem color="#FFF176" label="Ovulation" />
        <LegendItem color="#C8E6C9" label="Fertile" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  calendar: { borderRadius: 12, margin: 12 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13, color: '#666' },
});
