import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
  getCurrentPhase,
  getEffectiveCycleLength,
  getEffectivePeriodDuration,
  getActiveCycle,
  classifyCycle,
} from '../../src/utils/prediction';
import { toISODate, formatShort, fromISODate, diffInDays } from '../../src/utils/date';
import { buildStartMessage, buildEndMessage, buildFlagMessage } from '../../src/utils/cycleMessages';
import { useTheme, withOpacity } from '../../src/theme';
import { CycleRing } from '../../src/components/CycleRing';
import VariationCard from '../../src/components/VariationCard';

export default function Home() {
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const cycles = useAppStore((s) => s.cycles);
  const startPeriod = useAppStore((s) => s.startPeriod);
  const endPeriod = useAppStore((s) => s.endPeriod);

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

  const activeCycle = useMemo(() => getActiveCycle(cycles), [cycles]);
  const isActive = activeCycle !== null;

  const [card, setCard] = useState<{ message: string; tone: 'normal' | 'short' | 'long' | 'flagged' } | null>(null);
  const [flagCard, setFlagCard] = useState<{ message: string } | null>(null);
  const [pickerMode, setPickerMode] = useState<null | 'start' | 'end'>(null);
  const [promptDismissed, setPromptDismissed] = useState(false);

  const daysUntilLabel = daysUntil <= 0 ? 'Today' : `In ${daysUntil} days`;

  const handleStart = async (date: string) => {
    // Actual cycle length = days from the previous period start to this new start.
    // If there is no prior start, treat it as on-schedule (effectiveLength).
    const prevStart = settings.lastPeriodStart;
    const actual = prevStart ? diffInDaysSafe(prevStart, date) : effectiveLength;
    await startPeriod(date);
    const { tone } = classifyCycle(actual, effectiveLength, 'length');
    if (tone === 'flagged') {
      setFlagCard({ message: buildFlagMessage('length') });
    } else {
      setCard({ message: buildStartMessage(actual, effectiveLength), tone });
    }
  };

  const handleEnd = async (date: string) => {
    if (!activeCycle) return;
    const duration = diffInDaysSafe(activeCycle.startDate, date) + 1;
    await endPeriod(date);
    const { tone } = classifyCycle(duration, effectiveDuration, 'duration');
    if (tone === 'flagged') {
      setFlagCard({ message: buildFlagMessage('duration') });
    } else {
      setCard({ message: buildEndMessage(duration, effectiveDuration), tone });
    }
  };

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

        {/* Smart prompt (C) */}
        {!isActive && daysUntil <= 0 && !promptDismissed && (
          <View
            style={{
              width: '100%',
              marginTop: 24,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: withOpacity(colors.border, 0.6),
              padding: 16,
              boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
              Has your period started?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleStart(toISODate(new Date()))}
                style={{ flex: 1, backgroundColor: colors.brand, borderRadius: 12, borderCurve: 'continuous', paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPromptDismissed(true)}
                style={{ flex: 1, backgroundColor: withOpacity(colors.border, 0.4), borderRadius: 12, borderCurve: 'continuous', paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Not yet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reassurance / flag cards */}
        {card && <VariationCard message={card.message} tone={card.tone} onDismiss={() => setCard(null)} />}
        {flagCard && <VariationCard message={flagCard.message} tone="flagged" onDismiss={() => setFlagCard(null)} />}

        {/* Period start/end button */}
        <TouchableOpacity
          onPress={() => (isActive ? handleEnd(toISODate(new Date())) : handleStart(toISODate(new Date())))}
          activeOpacity={0.85}
          style={{
            marginTop: 24,
            width: '100%',
            backgroundColor: isActive ? withOpacity(colors.brand, 0.12) : colors.brand,
            borderWidth: isActive ? 1 : 0,
            borderColor: colors.brand,
            borderRadius: 20,
            borderCurve: 'continuous',
            paddingVertical: 18,
            alignItems: 'center',
            boxShadow: isActive ? 'none' : '0px 6px 14px rgba(0,0,0,0.2)',
          }}
        >
          <Text style={{ color: isActive ? colors.brand : '#FFF', fontWeight: '800', fontSize: 16 }}>
            {isActive ? 'Period ended' : 'Period started'}
          </Text>
        </TouchableOpacity>

        {/* Wrong day? precise correction */}
        <TouchableOpacity onPress={() => setPickerMode(isActive ? 'end' : 'start')} style={{ marginTop: 10, paddingVertical: 6 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Wrong day?</Text>
        </TouchableOpacity>

        {pickerMode && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, selected) => {
              const mode = pickerMode;
              setPickerMode(null);
              if (!selected) return;
              const iso = toISODate(selected);
              mode === 'end' ? handleEnd(iso) : handleStart(iso);
            }}
          />
        )}

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

function diffInDaysSafe(fromISO: string, toISO: string): number {
  return diffInDays(fromISODate(fromISO), fromISODate(toISO));
}
