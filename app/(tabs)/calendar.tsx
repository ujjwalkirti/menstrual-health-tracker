import { useMemo } from 'react';
import { View, Text } from 'react-native';
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

    cycles.forEach((cycle) => {
      let d = fromISODate(cycle.startDate);
      const end = fromISODate(cycle.endDate);
      while (d <= end) {
        marks[toISODate(d)] = { selected: true, selectedColor: '#E91E8C' };
        d = addDays(d, 1);
      }
    });

    const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
    const ovulation = calculateOvulation(nextPeriod);
    const fertile = getFertileWindow(ovulation);

    let pd = nextPeriod;
    for (let i = 0; i < settings.periodDuration; i++) {
      const key = toISODate(pd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#FFB6C1' };
      pd = addDays(pd, 1);
    }

    let fd = fertile.start;
    while (fd <= fertile.end) {
      const key = toISODate(fd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#C8E6C9' };
      fd = addDays(fd, 1);
    }

    const ovKey = toISODate(ovulation);
    if (!marks[ovKey]) marks[ovKey] = { selected: true, selectedColor: '#FFF176' };

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
    <View className="flex-1 bg-pink-bg">
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
        style={{ borderRadius: 12, margin: 12 }}
      />
      <View className="flex-row flex-wrap px-4 pt-2 gap-3">
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
    <View className="flex-row items-center gap-1.5">
      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
  );
}
