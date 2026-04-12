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
import type { DailyLog } from '../../src/models/types';

const SYMPTOMS = ['cramps', 'headache', 'fatigue', 'acne'] as const;
const MOODS = ['Happy', 'Calm', 'Sad', 'Anxious', 'Irritable'] as const;
const FLOWS = ['light', 'medium', 'heavy'] as const;

export default function LogScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const logs = useAppStore((s) => s.logs);
  const addLog = useAppStore((s) => s.addLog);
  const updateLog = useAppStore((s) => s.updateLog);
  const deleteLog = useAppStore((s) => s.deleteLog);

  const existing = useMemo(() => logs.find((l) => l.date === date), [logs, date]);

  const [mood, setMood] = useState<string>(existing?.mood ?? '');
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [flow, setFlow] = useState<DailyLog['flow']>(existing?.flow);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    const log: DailyLog = {
      id: existing?.id ?? `${date}-${Date.now()}`,
      date: date!,
      mood: mood || undefined,
      symptoms: symptoms.length ? symptoms : undefined,
      flow,
      notes: notes || undefined,
    };
    if (existing) {
      await updateLog(log);
    } else {
      await addLog(log);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Log', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLog(existing!.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerClassName="p-6 bg-pink-bg flex-grow"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-lg font-bold text-pink-brand mb-6">{date}</Text>

      <Section label="Mood">
        <ChipRow>
          {MOODS.map((m) => (
            <Chip
              key={m}
              label={m}
              active={mood === m}
              onPress={() => setMood(mood === m ? '' : m)}
            />
          ))}
        </ChipRow>
      </Section>

      <Section label="Symptoms">
        <ChipRow>
          {SYMPTOMS.map((s) => (
            <Chip
              key={s}
              label={s}
              active={symptoms.includes(s)}
              onPress={() => toggleSymptom(s)}
            />
          ))}
        </ChipRow>
      </Section>

      <Section label="Flow">
        <ChipRow>
          {FLOWS.map((f) => (
            <Chip
              key={f}
              label={f}
              active={flow === f}
              onPress={() => setFlow(flow === f ? undefined : f)}
            />
          ))}
        </ChipRow>
      </Section>

      <Section label="Notes">
        <TextInput
          className="bg-white rounded-xl border border-pink-border px-4 py-3 min-h-[100px] text-base text-gray-800"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="How are you feeling?"
          placeholderTextColor="#CCC"
          textAlignVertical="top"
        />
      </Section>

      <TouchableOpacity
        className="bg-pink-brand rounded-2xl py-5 items-center mt-8"
        style={{ shadowColor: '#E91E8C', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}
        onPress={handleSave}
      >
        <Text className="text-white text-base font-bold">Save</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity className="items-center mt-4 py-2" onPress={handleDelete}>
          <Text className="text-red-soft text-sm">Delete Entry</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-2">
      <Text className="text-sm font-semibold text-gray-500 mt-5 mb-2.5">{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-2">{children}</View>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full border ${
        active
          ? 'bg-pink-brand border-pink-brand'
          : 'bg-white border-pink-border'
      }`}
      onPress={onPress}
    >
      <Text className={active ? 'text-white text-sm font-semibold' : 'text-gray-500 text-sm'}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
