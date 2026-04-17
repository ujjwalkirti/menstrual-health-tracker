import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme, withOpacity } from '../../src/theme';
import { formatHeader } from '../../src/utils/date';
import type { DailyLog } from '../../src/models/types';

const MOODS: { label: string; emoji: string }[] = [
  { label: 'Happy',     emoji: '😊' },
  { label: 'Calm',      emoji: '😌' },
  { label: 'Sad',       emoji: '😢' },
  { label: 'Anxious',   emoji: '😰' },
  { label: 'Irritable', emoji: '😤' },
];

const SYMPTOMS: { label: string; emoji: string; key: string }[] = [
  { label: 'Cramps',   emoji: '🌊', key: 'cramps' },
  { label: 'Headache', emoji: '🤕', key: 'headache' },
  { label: 'Fatigue',  emoji: '😴', key: 'fatigue' },
  { label: 'Acne',     emoji: '✨', key: 'acne' },
];

const FLOWS: { label: string; value: DailyLog['flow'] }[] = [
  { label: 'Light',  value: 'light' },
  { label: 'Medium', value: 'medium' },
  { label: 'Heavy',  value: 'heavy' },
];

export default function LogScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { colors } = useTheme();
  const logs = useAppStore((s) => s.logs);
  const addLog = useAppStore((s) => s.addLog);
  const updateLog = useAppStore((s) => s.updateLog);
  const deleteLog = useAppStore((s) => s.deleteLog);

  const existing = useMemo(() => logs.find((l) => l.date === date), [logs, date]);

  const [mood, setMood] = useState(existing?.mood ?? '');
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [flow, setFlow] = useState<DailyLog['flow']>(existing?.flow);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const toggleSymptom = (key: string) =>
    setSymptoms((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);

  const handleSave = async () => {
    const log: DailyLog = {
      id: existing?.id ?? `${date}-${Date.now()}`,
      date: date!,
      mood: mood || undefined,
      symptoms: symptoms.length ? symptoms : undefined,
      flow,
      notes: notes || undefined,
    };
    existing ? await updateLog(log) : await addLog(log);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Log', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await deleteLog(existing!.id); router.back(); },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text
        style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 24 }}
        selectable
      >
        {date ? formatHeader(date) : ''}
      </Text>

      {/* Mood */}
      <Section label="Mood" colors={colors}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MOODS.map(({ label, emoji }) => (
            <EmojiChip
              key={label}
              label={label}
              emoji={emoji}
              active={mood === label}
              onPress={() => setMood(mood === label ? '' : label)}
              colors={colors}
            />
          ))}
        </View>
      </Section>

      {/* Flow */}
      <Section label="Flow" colors={colors}>
        <View style={{ gap: 8 }}>
          {FLOWS.map(({ label, value }, index) => {
            const active = flow === value;
            const fillPercent = ((index + 1) / 3) * 100;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setFlow(flow === value ? undefined : value)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: active ? withOpacity(colors.brand, 0.1) : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.brand : colors.border,
                }}
              >
                <Text style={{ width: 52, fontSize: 13, fontWeight: '600', color: active ? colors.brand : colors.textSecondary }}>
                  {label}
                </Text>
                <View style={{ flex: 1, height: 6, backgroundColor: withOpacity(colors.border, 0.5), borderRadius: 3 }}>
                  <View
                    style={{
                      width: `${fillPercent}%`,
                      height: '100%',
                      borderRadius: 3,
                      backgroundColor: active ? colors.brand : withOpacity(colors.textSecondary, 0.35),
                    }}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      {/* Symptoms */}
      <Section label="Symptoms" colors={colors}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SYMPTOMS.map(({ label, emoji, key }) => (
            <EmojiChip
              key={key}
              label={label}
              emoji={emoji}
              active={symptoms.includes(key)}
              onPress={() => toggleSymptom(key)}
              colors={colors}
            />
          ))}
        </View>
      </Section>

      {/* Notes */}
      <Section label="Notes" colors={colors}>
        <TextInput
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            minHeight: 100,
            fontSize: 15,
            color: colors.textPrimary,
            textAlignVertical: 'top',
          }}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="How are you feeling today?"
          placeholderTextColor={colors.textSecondary}
        />
      </Section>

      {/* Save */}
      <TouchableOpacity
        onPress={handleSave}
        activeOpacity={0.85}
        style={{
          marginTop: 24,
          backgroundColor: colors.brand,
          borderRadius: 20,
          paddingVertical: 18,
          alignItems: 'center',
          shadowColor: colors.brand,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Save</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity
          onPress={handleDelete}
          style={{ alignItems: 'center', marginTop: 16, paddingVertical: 8 }}
        >
          <Text style={{ color: '#E57373', fontSize: 13 }}>Delete Entry</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Section({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 20, marginBottom: 10, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function EmojiChip({
  label,
  emoji,
  active,
  onPress,
  colors,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 24,
        borderWidth: 1,
        backgroundColor: active ? withOpacity(colors.brand, 0.1) : colors.surface,
        borderColor: active ? colors.brand : colors.border,
      }}
    >
      <Text style={{ fontSize: 15 }}>{emoji}</Text>
      <Text style={{ fontSize: 13, fontWeight: active ? '700' : '400', color: active ? colors.brand : colors.textSecondary }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
