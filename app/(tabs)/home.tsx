import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
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
import { useTheme, withOpacity, type ThemeColors } from '../../src/theme';
import { CycleRing } from '../../src/components/CycleRing';
import VariationCard from '../../src/components/VariationCard';

const CARD_SHADOW = '0px 4px 16px rgba(0,0,0,0.06)';
const LIFT_SHADOW = '0px 8px 20px rgba(0,0,0,0.10)';

export default function Home() {
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const cycles = useAppStore((s) => s.cycles);
  const startPeriod = useAppStore((s) => s.startPeriod);
  const endPeriod = useAppStore((s) => s.endPeriod);
  const undoStart = useAppStore((s) => s.undoStart);

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

  const [card, setCard] = useState<{ message: string; tone: 'normal' | 'short' | 'long' | 'flagged'; kind: 'start' | 'end' } | null>(null);
  const [flagCard, setFlagCard] = useState<{ message: string; kind: 'start' | 'end' } | null>(null);
  const [pickerMode, setPickerMode] = useState<null | 'start' | 'end'>(null);
  const [promptDismissed, setPromptDismissed] = useState(false);

  const daysUntilLabel = daysUntil <= 0 ? 'Today' : `In ${daysUntil} days`;
  const showPrompt = !isActive && daysUntil <= 0 && !promptDismissed;

  const handleStart = async (date: string) => {
    // Actual cycle length = days from the previous period start to this new start.
    // If there is no prior start, treat it as on-schedule (effectiveLength).
    const prevStart = settings.lastPeriodStart;
    const actual = prevStart ? diffInDaysSafe(prevStart, date) : effectiveLength;
    await startPeriod(date);
    const { tone } = classifyCycle(actual, effectiveLength, 'length');
    if (tone === 'flagged') {
      setFlagCard({ message: buildFlagMessage('length'), kind: 'start' });
    } else {
      setCard({ message: buildStartMessage(actual, effectiveLength), tone, kind: 'start' });
    }
  };

  const handleUndoStart = async () => {
    await undoStart();
    setCard(null);
    setFlagCard(null);
  };

  const handleEnd = async (date: string) => {
    if (!activeCycle) return;
    const duration = diffInDaysSafe(activeCycle.startDate, date) + 1;
    await endPeriod(date);
    const { tone } = classifyCycle(duration, effectiveDuration, 'duration');
    if (tone === 'flagged') {
      setFlagCard({ message: buildFlagMessage('duration'), kind: 'end' });
    } else {
      setCard({ message: buildEndMessage(duration, effectiveDuration), tone, kind: 'end' });
    }
  };

  // Status line shown inside the period card.
  const statusLabel = isActive
    ? `Period · day ${activeCycle ? diffInDaysSafe(activeCycle.startDate, toISODate(new Date())) + 1 : 1}`
    : `Day ${cycleDay} · ${phase}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Cycle Ring Hero */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 28 }}>
          <CycleRing
            cycleDay={cycleDay}
            cycleLength={effectiveLength}
            periodDuration={effectiveDuration}
            phase={phase}
          />
        </View>

        {/* Stat Pills */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatPill label="Next period" value={daysUntilLabel} colors={colors} />
          <StatPill
            label="Expected on"
            value={formatShort(toISODate(nextPeriodDate))}
            colors={colors}
          />
        </View>

        {/* Period status card — groups status, primary action, and correction */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 24,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: withOpacity(colors.border, 0.6),
            padding: 20,
            boxShadow: CARD_SHADOW,
          }}
        >
          {showPrompt ? (
            <>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                Has your period started?
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 16 }}>
                It's expected around now.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <PrimaryButton
                  label="Yes, today"
                  colors={colors}
                  style={{ flex: 1 }}
                  onPress={() => handleStart(toISODate(new Date()))}
                />
                <GhostButton
                  label="Not yet"
                  colors={colors}
                  style={{ flex: 1 }}
                  onPress={() => setPromptDismissed(true)}
                />
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isActive ? colors.period : colors.fertile,
                  }}
                />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 }}>
                  {statusLabel.toUpperCase()}
                </Text>
              </View>
              <PrimaryButton
                label={isActive ? 'End period today' : 'Period started today'}
                colors={colors}
                variant={isActive ? 'outline' : 'solid'}
                onPress={() =>
                  isActive ? handleEnd(toISODate(new Date())) : handleStart(toISODate(new Date()))
                }
              />
            </>
          )}

          {/* Quiet inline correction link */}
          <Pressable
            onPress={() => setPickerMode(isActive ? 'end' : 'start')}
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 14 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              Choose a different day
            </Text>
          </Pressable>
        </View>

        {/* Reassurance / flag cards */}
        {card ? (
          <VariationCard
            message={card.message}
            tone={card.tone}
            onDismiss={() => setCard(null)}
            onUndo={card.kind === 'start' ? handleUndoStart : undefined}
          />
        ) : null}
        {flagCard ? (
          <VariationCard
            message={flagCard.message}
            tone="flagged"
            onDismiss={() => setFlagCard(null)}
            onUndo={flagCard.kind === 'start' ? handleUndoStart : undefined}
          />
        ) : null}

        {pickerMode ? (
          <DateTimePicker
            value={new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, selected) => {
              const mode = pickerMode;
              setPickerMode(null);
              if (!selected) return;
              const iso = toISODate(selected);
              if (mode === 'end') {
                handleEnd(iso);
              } else {
                handleStart(iso);
              }
            }}
          />
        ) : null}

        {/* Secondary action — log today's details */}
        <GhostButton
          label="+ Log today's details"
          colors={colors}
          style={{ marginTop: 16 }}
          onPress={() => router.push(`/log/${toISODate(new Date())}`)}
        />
      </ScrollView>
    </View>
  );
}

function PrimaryButton({
  label,
  colors,
  onPress,
  variant = 'solid',
  style,
}: {
  label: string;
  colors: ThemeColors;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  style?: object;
}) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: outline ? withOpacity(colors.brand, 0.1) : colors.brand,
          borderWidth: outline ? 1.5 : 0,
          borderColor: colors.brand,
          borderRadius: 16,
          borderCurve: 'continuous',
          paddingVertical: 16,
          alignItems: 'center',
          boxShadow: outline ? 'none' : LIFT_SHADOW,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Text style={{ color: outline ? colors.brand : '#FFFFFF', fontWeight: '800', fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function GhostButton({
  label,
  colors,
  onPress,
  style,
}: {
  label: string;
  colors: ThemeColors;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: withOpacity(colors.border, 0.8),
          borderRadius: 16,
          borderCurve: 'continuous',
          paddingVertical: 15,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

function StatPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderCurve: 'continuous',
        padding: 16,
        gap: 4,
        boxShadow: CARD_SHADOW,
        borderWidth: 1,
        borderColor: withOpacity(colors.border, 0.5),
      }}
    >
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 20, color: colors.textPrimary, fontWeight: '800' }} selectable>
        {value}
      </Text>
    </View>
  );
}

function diffInDaysSafe(fromISO: string, toISO: string): number {
  return diffInDays(fromISODate(fromISO), fromISODate(toISO));
}
