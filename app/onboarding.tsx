import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { toISODate } from '../src/utils/date';

export default function Onboarding() {
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodDuration, setPeriodDuration] = useState('5');
  const [lastPeriodStart, setLastPeriodStart] = useState(toISODate(new Date()));

  const handleSubmit = async () => {
    await updateSettings({
      cycleLength: parseInt(cycleLength, 10) || 28,
      periodDuration: parseInt(periodDuration, 10) || 5,
      lastPeriodStart: lastPeriodStart || toISODate(new Date()),
      hasOnboarded: true,
    });
    router.replace('/(tabs)/home');
  };

  const handleSkip = async () => {
    await updateSettings({ hasOnboarded: true });
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Let's personalise your tracker</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Average cycle length (days)</Text>
          <TextInput
            style={styles.input}
            value={cycleLength}
            onChangeText={setCycleLength}
            keyboardType="number-pad"
            placeholder="28"
            placeholderTextColor="#CCC"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Period duration (days)</Text>
          <TextInput
            style={styles.input}
            value={periodDuration}
            onChangeText={setPeriodDuration}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor="#CCC"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Last period start date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={lastPeriodStart}
            onChangeText={setLastPeriodStart}
            placeholder="2024-01-01"
            placeholderTextColor="#CCC"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip — use defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
  },
  title: { fontSize: 36, fontWeight: '800', color: '#E91E8C', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#999', marginBottom: 40 },
  field: { marginBottom: 22 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#E8D0DC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#333',
  },
  button: {
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
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  skipButton: { alignItems: 'center', marginTop: 20, padding: 8 },
  skipText: { color: '#BBB', fontSize: 14 },
});
