import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.dateText}>{date}</Text>

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
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="How are you feeling?"
          placeholderTextColor="#CCC"
          textAlignVertical="top"
        />
      </Section>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Entry</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={chipStyles.row}>{children}</View>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[chipStyles.chip, active && chipStyles.chipActive]}
      onPress={onPress}
    >
      <Text style={[chipStyles.text, active && chipStyles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#FFF0F5', flexGrow: 1 },
  dateText: { fontSize: 18, fontWeight: '700', color: '#E91E8C', marginBottom: 24 },
  notesInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8D0DC',
    padding: 14,
    minHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#E91E8C',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  deleteButton: { alignItems: 'center', marginTop: 16, padding: 8 },
  deleteText: { color: '#E57373', fontSize: 14 },
});

const sectionStyles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10, marginTop: 20 },
});

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D0DC',
    backgroundColor: '#FFF',
  },
  chipActive: { backgroundColor: '#E91E8C', borderColor: '#E91E8C' },
  text: { color: '#666', fontSize: 14 },
  textActive: { color: '#FFF', fontWeight: '600' },
});
