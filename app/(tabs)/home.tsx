import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
  getCurrentPhase,
  getEffectiveCycleLength,
  getEffectivePeriodDuration,
  getActiveCycle,
} from '../../src/utils/prediction';
import { toISODate, formatShort } from '../../src/utils/date';
import { useTheme, withOpacity } from '../../src/theme';
import { CycleRing } from '../../src/components/CycleRing';

export default function Home() {
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const cycles = useAppStore((s) => s.cycles);

  const effectiveLength = useMemo(
    () => getEffectiveCycleLength(cycles, settings),
    [cycles, settings],
  );
  const effectiveDuration = useMemo(
    () => getEffectivePeriodDuration(cycles, settings),
    [cycles, settings],
  );

  const cycleDay = useMemo(
    () => getCurrentCycleDay(settings.lastPeriodStart),
    [settings.lastPeriodStart],
  );

  const daysUntil = useMemo(
    () => getDaysUntilNextPeriod(settings.lastPeriodStart, effectiveLength),
    [settings.lastPeriodStart, effectiveLength],
  );

  const nextPeriodDate = useMemo(
    () => calculateNextPeriod(settings.lastPeriodStart, effectiveLength),
    [settings.lastPeriodStart, effectiveLength],
  );

  const phase = useMemo(
    () => getCurrentPhase(cycleDay, effectiveLength, effectiveDuration),
    [cycleDay, effectiveLength, effectiveDuration],
  );

  const daysUntilLabel = daysUntil <= 0 ? 'Today' : `In ${daysUntil} days`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cycle Ring Hero */}
        <View style={{ marginTop: 16, marginBottom: 32 }}>
          <CycleRing
            cycleDay={cycleDay}
            cycleLength={effectiveLength}
            periodDuration={effectiveDuration}
            phase={phase}
          />
        </View>

        {/* Stat Pills */}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <StatPill label="Next period" value={daysUntilLabel} colors={colors} />
          <StatPill
            label="Expected on"
            value={formatShort(toISODate(nextPeriodDate))}
            colors={colors}
          />
        </View>

        {/* Log Today CTA */}
        <TouchableOpacity
          onPress={() => router.push(`/log/${toISODate(new Date())}`)}
          activeOpacity={0.85}
          style={{
            marginTop: 24,
            width: '100%',
            backgroundColor: colors.brand,
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
            shadowColor: colors.brand,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>+ Log Today</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: withOpacity(colors.border, 0.5),
      }}
    >
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
        {label.toUpperCase()}
      </Text>
      <Text
        style={{ fontSize: 20, color: colors.textPrimary, fontWeight: '800' }}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}
