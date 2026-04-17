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
import { useTheme, withOpacity } from '../../src/theme';
import type { ThemePreference } from '../../src/theme';
import {
  requestNotificationPermissions,
  schedulePeriodReminder,
  scheduleDailyLogReminder,
  cancelAllNotifications,
} from '../../src/utils/notifications';
import { calculateNextPeriod } from '../../src/utils/prediction';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Light',  value: 'light' },
  { label: 'System', value: 'system' },
  { label: 'Dark',   value: 'dark' },
];

export default function Settings() {
  const { colors, preference, setPreference } = useTheme();
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
          onPress: async () => { await resetAll(); router.replace('/onboarding'); },
        },
      ],
    );
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  };

  const labelStyle = {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 8,
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
    >
      {/* Appearance */}
      <SectionHeader label="Appearance" colors={colors} />
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 4,
          marginBottom: 28,
        }}
      >
        {THEME_OPTIONS.map(({ label, value }) => {
          const active = preference === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => setPreference(value)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 10,
                backgroundColor: active ? colors.brand : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFF' : colors.textSecondary }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cycle Settings */}
      <SectionHeader label="Cycle Settings" colors={colors} />

      <Text style={labelStyle}>Cycle length (days)</Text>
      <TextInput
        style={{ ...inputStyle, marginBottom: 20 }}
        value={cycleLength}
        onChangeText={setCycleLength}
        keyboardType="number-pad"
      />

      <Text style={labelStyle}>Period duration (days)</Text>
      <TextInput
        style={{ ...inputStyle, marginBottom: 20 }}
        value={periodDuration}
        onChangeText={setPeriodDuration}
        keyboardType="number-pad"
      />

      {/* Notifications */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: '500' }}>Notifications</Text>
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
          trackColor={{ false: colors.border, true: colors.brand }}
          thumbColor="#FFF"
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        activeOpacity={0.85}
        style={{
          backgroundColor: colors.brand,
          borderRadius: 20,
          paddingVertical: 18,
          alignItems: 'center',
          marginBottom: 28,
          shadowColor: colors.brand,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Save Changes</Text>
      </TouchableOpacity>

      <View style={{ height: 1, backgroundColor: withOpacity(colors.border, 0.8), marginBottom: 24 }} />

      <TouchableOpacity onPress={handleReset} style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text style={{ color: '#E57373', fontSize: 14, fontWeight: '500' }}>Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionHeader({
  label,
  colors,
}: {
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 12 }}>
      {label.toUpperCase()}
    </Text>
  );
}
