import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
    <ScrollView contentContainerClassName="p-6 bg-pink-bg flex-grow">
      <View className="mb-6">
        <Text className="text-sm text-gray-500 font-medium mb-2">Cycle length (days)</Text>
        <TextInput
          className="border border-pink-border rounded-xl px-4 py-3 text-base bg-white text-gray-800"
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="number-pad"
        />
      </View>

      <View className="mb-6">
        <Text className="text-sm text-gray-500 font-medium mb-2">Period duration (days)</Text>
        <TextInput
          className="border border-pink-border rounded-xl px-4 py-3 text-base bg-white text-gray-800"
          value={periodDuration}
          onChangeText={setPeriodDuration}
          keyboardType="number-pad"
        />
      </View>

      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-sm text-gray-500 font-medium">Notifications</Text>
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

      <TouchableOpacity
        className="bg-pink-brand rounded-2xl py-5 items-center"
        style={{ shadowColor: '#E91E8C', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}
        onPress={handleSave}
      >
        <Text className="text-white text-base font-bold">Save Changes</Text>
      </TouchableOpacity>

      <View className="h-px bg-pink-divider my-7" />

      <TouchableOpacity className="items-center py-2" onPress={handleReset}>
        <Text className="text-red-soft text-sm font-medium">Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
