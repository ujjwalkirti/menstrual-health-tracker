import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  requestNotificationPermissions,
  schedulePeriodReminder,
  scheduleDailyLogReminder,
  cancelAllNotifications,
} from '../../src/utils/notifications';
import { calculateNextPeriod } from '../../src/utils/prediction';

export default function Settings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);

  const [cycleLength, setCycleLength] = useState(String(settings.cycleLength));
  const [periodDuration, setPeriodDuration] = useState(String(settings.periodDuration));
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleSave = async () => {
    const cl = parseInt(cycleLength, 10);
    const pd = parseInt(periodDuration, 10);
    if (!cl || cl < 20 || cl > 45) {
      Alert.alert('Invalid input', 'Cycle length should be between 20 and 45 days.');
      return;
    }
    if (!pd || pd < 1 || pd > 10) {
      Alert.alert('Invalid input', 'Period duration should be between 1 and 10 days.');
      return;
    }
    await updateSettings({ cycleLength: cl, periodDuration: pd });
    Alert.alert('Saved', 'Settings updated.');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all cycles, logs, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Cycle length (days)</Text>
        <TextInput
          style={styles.input}
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Period duration (days)</Text>
        <TextInput
          style={styles.input}
          value={periodDuration}
          onChangeText={setPeriodDuration}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={async (value) => {
            if (value) {
              const granted = await requestNotificationPermissions();
              if (!granted) {
                Alert.alert('Permission denied', 'Enable notifications in your device settings.');
                return;
              }
              const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
              await schedulePeriodReminder(nextPeriod);
              await scheduleDailyLogReminder();
            } else {
              await cancelAllNotifications();
            }
            setNotificationsEnabled(value);
          }}
          trackColor={{ false: '#DDD', true: '#E91E8C' }}
          thumbColor="#FFF"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetText}>Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#FFF0F5', flexGrow: 1 },
  field: { marginBottom: 22 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
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
  saveButton: {
    backgroundColor: '#E91E8C',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#E91E8C',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0D8E4', marginVertical: 28 },
  resetButton: { alignItems: 'center', padding: 8 },
  resetText: { color: '#E57373', fontSize: 15, fontWeight: '500' },
});
