import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, withOpacity } from '../theme';
import { toISODate, formatMonthYear } from '../utils/date';

export type DayMarkType = 'period' | 'predicted' | 'ovulation' | 'fertile' | 'none';

export type DayMark = {
  type: DayMarkType;
  hasLog?: boolean;
};

export type MarkedDates = Record<string, DayMark>;

interface CalendarViewProps {
  markedDates: MarkedDates;
  onDayPress: (dateStr: string) => void;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarCells(year: number, month: number): Array<string | null> {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    );
  }
  return cells;
}

function getCellBg(
  mark: DayMark | undefined,
  colors: ReturnType<typeof useTheme>['colors'],
): string | undefined {
  if (!mark) return undefined;
  switch (mark.type) {
    case 'period':    return colors.period;
    case 'predicted': return withOpacity(colors.period, 0.45);
    case 'ovulation': return colors.ovulation;
    case 'fertile':   return withOpacity(colors.fertile, 0.45);
    default:          return undefined;
  }
}

export function CalendarView({ markedDates, onDayPress }: CalendarViewProps) {
  const { colors } = useTheme();
  const todayDate = new Date();
  const today = toISODate(todayDate);

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());

  const cells = getCalendarCells(viewYear, viewMonth);
  const headerDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}>
      {/* Month header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Pressable onPress={prevMonth} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.brand} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
          {formatMonthYear(headerDateStr)}
        </Text>
        <Pressable onPress={nextMonth} style={{ padding: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.brand} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {WEEK_DAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <View key={`empty-${idx}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          }

          const mark = markedDates[dateStr];
          const isToday = dateStr === today;
          const cellBg = getCellBg(mark, colors);

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onDayPress(dateStr)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  backgroundColor: cellBg ?? 'transparent',
                  borderWidth: isToday && !cellBg ? 1.5 : 0,
                  borderColor: colors.brand,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isToday ? '700' : '400',
                    color: cellBg ? '#FFF' : isToday ? colors.brand : colors.textPrimary,
                  }}
                >
                  {parseInt(dateStr.split('-')[2], 10)}
                </Text>
                {mark?.hasLog && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: cellBg ? '#FFF' : colors.brand,
                      marginTop: 2,
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingHorizontal: 4 }}>
        <LegendItem color={colors.period} label="Period" />
        <LegendItem color={withOpacity(colors.period, 0.45)} label="Predicted" />
        <LegendItem color={colors.ovulation} label="Ovulation" />
        <LegendItem color={withOpacity(colors.fertile, 0.45)} label="Fertile" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}
