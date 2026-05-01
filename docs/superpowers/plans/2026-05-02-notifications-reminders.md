# Notifications & Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add period, fertile window, and ovulation local push notifications with per-type toggles and a configurable period lead time.

**Architecture:** Extend `Settings` with four notification fields. A single `scheduleNotifications(settings)` utility cancels all existing notifications and re-schedules enabled ones. It is called after store hydration and on every settings change.

**Tech Stack:** `expo-notifications` (already installed), Jest + jest-expo for tests, React Native inline styles with theme tokens.

---

## File Map

| File | Change |
|------|--------|
| `src/models/types.ts` | Add 4 notification fields to `Settings` and `DEFAULT_SETTINGS` |
| `src/utils/notifications.ts` | Replace existing ad-hoc functions with `scheduleNotifications(settings)` |
| `__tests__/utils/notifications.test.ts` | New — unit tests for scheduling logic |
| `app/_layout.tsx` | Call `scheduleNotifications` after hydration; re-call on settings change |
| `app/(tabs)/settings.tsx` | Replace single toggle with period/fertile/ovulation sub-section |

---

## Task 1: Add notification fields to Settings type

**Files:**
- Modify: `src/models/types.ts`

- [ ] **Step 1: Update Settings type and DEFAULT_SETTINGS**

Replace the entire file content:

```ts
export type Settings = {
  cycleLength: number;
  periodDuration: number;
  lastPeriodStart: string; // ISO date string: YYYY-MM-DD
  hasOnboarded: boolean;
  notificationsPeriodEnabled: boolean;
  notificationsPeriodLeadDays: number; // 1–7
  notificationsFertileEnabled: boolean;
  notificationsOvulationEnabled: boolean;
};

export type Cycle = {
  id: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
};

export type DailyLog = {
  id: string;
  date: string; // ISO date string
  mood?: string;
  symptoms?: string[];
  flow?: 'light' | 'medium' | 'heavy';
  notes?: string;
};

export const DEFAULT_SETTINGS: Settings = {
  cycleLength: 28,
  periodDuration: 5,
  lastPeriodStart: new Date().toISOString().split('T')[0],
  hasOnboarded: false,
  notificationsPeriodEnabled: true,
  notificationsPeriodLeadDays: 2,
  notificationsFertileEnabled: true,
  notificationsOvulationEnabled: true,
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/personal-projects/testing-ai-editors/claude-code/menstrual-health-tracker
npx tsc --noEmit
```

Expected: No errors related to `Settings` type.

- [ ] **Step 3: Commit**

```bash
git add src/models/types.ts
git commit -m "feat: add notification preference fields to Settings type"
```

---

## Task 2: Rewrite notifications utility with scheduleNotifications

**Files:**
- Modify: `src/utils/notifications.ts`
- Create: `__tests__/utils/notifications.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/utils/notifications.test.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { scheduleNotifications } from '../../src/utils/notifications';
import { Settings } from '../../src/models/types';

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const mockRequest = Notifications.requestPermissionsAsync as jest.Mock;
const mockCancel = Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;
const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;

const BASE_SETTINGS: Settings = {
  cycleLength: 28,
  periodDuration: 5,
  lastPeriodStart: '2026-01-01',
  hasOnboarded: true,
  notificationsPeriodEnabled: true,
  notificationsPeriodLeadDays: 2,
  notificationsFertileEnabled: true,
  notificationsOvulationEnabled: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRequest.mockResolvedValue({ status: 'granted' });
  mockCancel.mockResolvedValue(undefined);
  mockSchedule.mockResolvedValue('mock-id');
  // Pin "now" to 2026-01-01 so nextPeriod (2026-01-29) is always in the future
  jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('scheduleNotifications', () => {
  it('cancels all existing notifications first', async () => {
    await scheduleNotifications(BASE_SETTINGS);
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('requests permissions before scheduling', async () => {
    await scheduleNotifications(BASE_SETTINGS);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('schedules all 3 notifications when all enabled', async () => {
    await scheduleNotifications(BASE_SETTINGS);
    expect(mockSchedule).toHaveBeenCalledTimes(3);
  });

  it('schedules period reminder leadDays before next period', async () => {
    await scheduleNotifications({ ...BASE_SETTINGS, notificationsPeriodLeadDays: 3 });
    const calls = mockSchedule.mock.calls;
    const periodCall = calls.find((c: any[]) =>
      c[0].content.title === 'Period reminder'
    );
    expect(periodCall).toBeDefined();
    // nextPeriod = 2026-01-29, lead = 3 → reminder = 2026-01-26
    const triggerDate: Date = periodCall[0].trigger.date;
    expect(triggerDate.getFullYear()).toBe(2026);
    expect(triggerDate.getMonth()).toBe(0); // January
    expect(triggerDate.getDate()).toBe(26);
    expect(triggerDate.getHours()).toBe(9);
  });

  it('does not schedule period notification when disabled', async () => {
    await scheduleNotifications({ ...BASE_SETTINGS, notificationsPeriodEnabled: false });
    const calls = mockSchedule.mock.calls;
    const periodCall = calls.find((c: any[]) =>
      c[0].content.title === 'Period reminder'
    );
    expect(periodCall).toBeUndefined();
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it('does not schedule fertile notification when disabled', async () => {
    await scheduleNotifications({ ...BASE_SETTINGS, notificationsFertileEnabled: false });
    const calls = mockSchedule.mock.calls;
    const fertileCall = calls.find((c: any[]) =>
      c[0].content.title === 'Fertile window'
    );
    expect(fertileCall).toBeUndefined();
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it('does not schedule ovulation notification when disabled', async () => {
    await scheduleNotifications({ ...BASE_SETTINGS, notificationsOvulationEnabled: false });
    const calls = mockSchedule.mock.calls;
    const ovulationCall = calls.find((c: any[]) =>
      c[0].content.title === 'Ovulation day'
    );
    expect(ovulationCall).toBeUndefined();
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it('does not schedule any notifications when permissions denied', async () => {
    mockRequest.mockResolvedValue({ status: 'denied' });
    await scheduleNotifications(BASE_SETTINGS);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('schedules 0 notifications when all disabled', async () => {
    await scheduleNotifications({
      ...BASE_SETTINGS,
      notificationsPeriodEnabled: false,
      notificationsFertileEnabled: false,
      notificationsOvulationEnabled: false,
    });
    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd D:/personal-projects/testing-ai-editors/claude-code/menstrual-health-tracker
npx jest __tests__/utils/notifications.test.ts --no-coverage
```

Expected: FAIL — `scheduleNotifications` is not exported from `notifications.ts`.

- [ ] **Step 3: Rewrite notifications.ts**

Replace the entire file:

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Settings } from '../models/types';
import { calculateNextPeriod, calculateOvulation, getFertileWindow } from './prediction';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotifications(settings: Settings): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const now = new Date();
  const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
  const ovulation = calculateOvulation(nextPeriod);
  const fertileWindow = getFertileWindow(ovulation);

  if (settings.notificationsPeriodEnabled) {
    const triggerDate = new Date(nextPeriod);
    triggerDate.setDate(triggerDate.getDate() - settings.notificationsPeriodLeadDays);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Period reminder',
          body: `Your period is expected in ${settings.notificationsPeriodLeadDays} day${settings.notificationsPeriodLeadDays === 1 ? '' : 's'}.`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    }
  }

  if (settings.notificationsFertileEnabled) {
    const triggerDate = new Date(fertileWindow.start);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Fertile window',
          body: 'Your fertile window starts today.',
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    }
  }

  if (settings.notificationsOvulationEnabled) {
    const triggerDate = new Date(ovulation);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ovulation day',
          body: 'Today is your estimated ovulation day.',
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    }
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/utils/notifications.test.ts --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npx jest --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/notifications.ts __tests__/utils/notifications.test.ts
git commit -m "feat: rewrite notifications utility with scheduleNotifications"
```

---

## Task 3: Wire scheduleNotifications into the app lifecycle

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update _layout.tsx to call scheduleNotifications after hydration and on settings changes**

Replace `app/_layout.tsx`:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '../src/store/useAppStore';
import { ThemeProvider, useTheme } from '../src/theme';
import { scheduleNotifications } from '../src/utils/notifications';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { colors } = useTheme();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="log/[date]"
        options={{
          title: 'Daily Log',
          presentation: 'modal',
          headerTintColor: colors.brand,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);
  const hydrated = useAppStore((s) => s.hydrated);
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    loadFromStorage().then(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      scheduleNotifications(settings);
    }
  }, [hydrated, settings]);

  if (!hydrated) return null;

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: schedule notifications on hydration and settings change"
```

---

## Task 4: Update Settings screen with per-type notification controls

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Replace the Settings screen**

Replace `app/(tabs)/settings.tsx` with the following:

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme, withOpacity } from '../../src/theme';
import type { ThemePreference } from '../../src/theme';
import { requestNotificationPermissions } from '../../src/utils/notifications';

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

  const handleNotificationToggle = async (
    field: 'notificationsPeriodEnabled' | 'notificationsFertileEnabled' | 'notificationsOvulationEnabled',
    value: boolean,
  ) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Enable notifications in your device settings to receive reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    await updateSettings({ [field]: value });
  };

  const handleLeadDaysChange = async (delta: number) => {
    const next = Math.min(7, Math.max(1, settings.notificationsPeriodLeadDays + delta));
    await updateSettings({ notificationsPeriodLeadDays: next });
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

  const rowStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: withOpacity(colors.border, 0.5),
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
      <SectionHeader label="Notifications" colors={colors} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          marginBottom: 28,
        }}
      >
        {/* Period reminder */}
        <View style={rowStyle}>
          <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: '500' }}>Period Reminder</Text>
          <Switch
            value={settings.notificationsPeriodEnabled}
            onValueChange={(v) => handleNotificationToggle('notificationsPeriodEnabled', v)}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor="#FFF"
          />
        </View>

        {settings.notificationsPeriodEnabled && (
          <View style={{ ...rowStyle, borderBottomWidth: 0 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Days before period
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleLeadDaysChange(-1)}
                disabled={settings.notificationsPeriodLeadDays <= 1}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: settings.notificationsPeriodLeadDays <= 1
                    ? withOpacity(colors.border, 0.4)
                    : colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600', lineHeight: 22 }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, minWidth: 16, textAlign: 'center' }}>
                {settings.notificationsPeriodLeadDays}
              </Text>
              <TouchableOpacity
                onPress={() => handleLeadDaysChange(1)}
                disabled={settings.notificationsPeriodLeadDays >= 7}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: settings.notificationsPeriodLeadDays >= 7
                    ? withOpacity(colors.border, 0.4)
                    : colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600', lineHeight: 22 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Fertile window */}
        <View style={rowStyle}>
          <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: '500' }}>Fertile Window Alert</Text>
          <Switch
            value={settings.notificationsFertileEnabled}
            onValueChange={(v) => handleNotificationToggle('notificationsFertileEnabled', v)}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor="#FFF"
          />
        </View>

        {/* Ovulation */}
        <View style={{ ...rowStyle, borderBottomWidth: 0 }}>
          <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: '500' }}>Ovulation Day Alert</Text>
          <Switch
            value={settings.notificationsOvulationEnabled}
            onValueChange={(v) => handleNotificationToggle('notificationsOvulationEnabled', v)}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor="#FFF"
          />
        </View>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat: expand notifications settings with per-type toggles and lead-days picker"
```

---

## Done

All four tasks complete. The feature is fully implemented:
- `Settings` type has notification preference fields
- `scheduleNotifications(settings)` handles all three notification types based on settings
- Notifications are rescheduled on app launch and every settings change
- Settings screen has period/fertile/ovulation toggles and a 1–7 day lead-time stepper
