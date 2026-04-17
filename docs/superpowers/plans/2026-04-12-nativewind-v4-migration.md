# NativeWind v4 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `StyleSheet.create()` inline styles across 5 screens with NativeWind v4 `className` props, using Tailwind CSS utility classes.

**Architecture:** Install NativeWind v4 and configure Babel + TypeScript, define the app's pink color palette as custom Tailwind theme tokens, then migrate each screen file one at a time — removing `StyleSheet.create()` blocks and replacing `style={}` props with `className=""`. The `react-native-calendars` `Calendar` component keeps its `theme` prop (not a RN View, so NativeWind doesn't apply to it).

**Tech Stack:** NativeWind v4, Tailwind CSS v3, babel-preset-expo, Expo SDK 54, React Native 0.81.5

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `tailwind.config.js` | Custom color tokens (`pink-brand`, `pink-bg`, etc.) |
| Modify | `babel.config.js` | Add NativeWind babel preset |
| Modify | `global.d.ts` / `expo-env.d.ts` | TypeScript `className` prop support |
| Modify | `app/onboarding.tsx` | Replace StyleSheet with className |
| Modify | `app/(tabs)/home.tsx` | Replace StyleSheet with className |
| Modify | `app/(tabs)/calendar.tsx` | Replace StyleSheet with className |
| Modify | `app/(tabs)/settings.tsx` | Replace StyleSheet with className |
| Modify | `app/log/[date].tsx` | Replace StyleSheet with className |

---

## Color Token Reference

The app uses a consistent palette. These become Tailwind custom colors:

| Token | Hex | Usage |
|-------|-----|-------|
| `pink-brand` | `#E91E8C` | Primary CTA, headings, highlights |
| `pink-bg` | `#FFF0F5` | Screen backgrounds |
| `pink-border` | `#E8D0DC` | Input/card borders |
| `pink-divider` | `#F0D8E4` | Divider lines |
| `red-soft` | `#E57373` | Destructive/delete text |

---

## Task 1: Install NativeWind v4

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install NativeWind v4 and Tailwind CSS v3**

```bash
npx expo install nativewind@^4.0.0 tailwindcss@^3.3.0
```

Expected output: packages added, no peer dependency errors.

- [ ] **Step 2: Verify installed versions**

```bash
cat node_modules/nativewind/package.json | grep '"version"'
cat node_modules/tailwindcss/package.json | grep '"version"'
```

Expected: nativewind `4.x.x`, tailwindcss `3.x.x`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install nativewind v4 and tailwindcss v3"
```

---

## Task 2: Configure Tailwind + Babel + TypeScript

**Files:**
- Create: `tailwind.config.js`
- Modify: `babel.config.js`
- Modify: `expo-env.d.ts`

- [ ] **Step 1: Create `tailwind.config.js`**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'pink-brand': '#E91E8C',
        'pink-bg':    '#FFF0F5',
        'pink-border':'#E8D0DC',
        'pink-divider':'#F0D8E4',
        'red-soft':   '#E57373',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Update `babel.config.js` to add NativeWind preset**

Replace the entire file with:

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: ['nativewind/babel'],
  };
};
```

- [ ] **Step 3: Add className TypeScript support to `expo-env.d.ts`**

Open `expo-env.d.ts`. Add this line at the top (before the existing `/// <reference` lines):

```ts
/// <reference types="nativewind/types" />
```

The file should look like:

```ts
/// <reference types="nativewind/types" />
/// <reference types="expo-router/types" />
```

- [ ] **Step 4: Start the dev server and confirm no startup errors**

```bash
npx expo start --clear
```

Expected: Metro bundler starts, no "Cannot find module nativewind" errors. Press `q` to quit.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js babel.config.js expo-env.d.ts
git commit -m "chore: configure nativewind v4, tailwind tokens, babel preset"
```

---

## Task 3: Migrate `app/onboarding.tsx`

**Files:**
- Modify: `app/onboarding.tsx`

- [ ] **Step 1: Replace the file content**

Replace the entire `app/onboarding.tsx` with:

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { toISODate } from '../src/utils/date';

export default function Onboarding() {
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodDuration, setPeriodDuration] = useState('5');
  const [lastPeriodStart, setLastPeriodStart] = useState(toISODate(new Date()));
  const [showCalendar, setShowCalendar] = useState(false);

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
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow p-7 bg-pink-bg justify-center">
        <Text className="text-4xl font-extrabold text-pink-brand mb-2">Welcome</Text>
        <Text className="text-base text-gray-400 mb-10">Let's personalise your tracker</Text>

        <View className="mb-6">
          <Text className="text-sm text-gray-500 font-medium mb-2">Average cycle length (days)</Text>
          <TextInput
            className="border border-pink-border rounded-xl px-4 py-3 text-base bg-white text-gray-800"
            value={cycleLength}
            onChangeText={setCycleLength}
            keyboardType="number-pad"
            placeholder="28"
            placeholderTextColor="#CCC"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm text-gray-500 font-medium mb-2">Period duration (days)</Text>
          <TextInput
            className="border border-pink-border rounded-xl px-4 py-3 text-base bg-white text-gray-800"
            value={periodDuration}
            onChangeText={setPeriodDuration}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor="#CCC"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm text-gray-500 font-medium mb-2">Last period start date</Text>
          <TouchableOpacity
            className="border border-pink-border rounded-xl px-4 py-3 bg-white"
            onPress={() => setShowCalendar(true)}
          >
            <Text className={lastPeriodStart ? 'text-gray-800 text-base' : 'text-gray-300 text-base'}>
              {lastPeriodStart || 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showCalendar} transparent animationType="fade">
          <TouchableOpacity
            className="flex-1 bg-black/40 justify-center px-6"
            activeOpacity={1}
            onPress={() => setShowCalendar(false)}
          >
            <View className="bg-white rounded-2xl overflow-hidden">
              <Calendar
                current={lastPeriodStart}
                maxDate={toISODate(new Date())}
                onDayPress={(day: { dateString: string }) => {
                  setLastPeriodStart(day.dateString);
                  setShowCalendar(false);
                }}
                markedDates={{
                  [lastPeriodStart]: { selected: true, selectedColor: '#E91E8C' },
                }}
                theme={{
                  selectedDayBackgroundColor: '#E91E8C',
                  todayTextColor: '#E91E8C',
                  arrowColor: '#E91E8C',
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity
          className="bg-pink-brand rounded-2xl py-5 items-center mt-8 shadow-lg"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}
          onPress={handleSubmit}
        >
          <Text className="text-white text-lg font-bold">Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center mt-5 py-2" onPress={handleSkip}>
          <Text className="text-gray-300 text-sm">Skip — use defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

> Note: Shadow with `shadowColor` using a custom hex must stay as an inline `style` prop — Tailwind cannot express arbitrary shadow colors. All other styling uses `className`.

- [ ] **Step 2: Verify in the running app**

Open the app to the onboarding screen. Confirm:
- Pink background (`#FFF0F5`)
- "Welcome" title is large and pink
- Inputs have rounded borders
- "Get Started" button is pink with visible shadow
- "Skip" link is grey

- [ ] **Step 3: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: migrate onboarding screen to NativeWind v4"
```

---

## Task 4: Migrate `app/(tabs)/home.tsx`

**Files:**
- Modify: `app/(tabs)/home.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
} from '../../src/utils/prediction';
import { toISODate, formatDisplay } from '../../src/utils/date';

export default function Home() {
  const settings = useAppStore((s) => s.settings);

  const cycleDay = useMemo(
    () => getCurrentCycleDay(settings.lastPeriodStart),
    [settings.lastPeriodStart]
  );

  const daysUntil = useMemo(
    () => getDaysUntilNextPeriod(settings.lastPeriodStart, settings.cycleLength),
    [settings.lastPeriodStart, settings.cycleLength]
  );

  const nextPeriodDate = useMemo(
    () => calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength),
    [settings.lastPeriodStart, settings.cycleLength]
  );

  const daysUntilLabel = daysUntil <= 0 ? 'Today' : String(daysUntil);

  return (
    <View className="flex-1 bg-pink-bg">
      <ScrollView
        contentContainerClassName="p-6 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-extrabold text-pink-brand mb-7">Your cycle</Text>

        <View
          className="bg-white rounded-2xl p-6 mb-4"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
        >
          <Text className="text-xs text-gray-400 font-medium mb-1">Current cycle day</Text>
          <Text className="text-4xl font-extrabold text-gray-800">{cycleDay}</Text>
        </View>

        <View
          className="bg-white rounded-2xl p-6 mb-4"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
        >
          <Text className="text-xs text-gray-400 font-medium mb-1">Days until next period</Text>
          <Text className="text-4xl font-extrabold text-gray-800">{daysUntilLabel}</Text>
        </View>

        <View
          className="bg-white rounded-2xl p-6 mb-4"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
        >
          <Text className="text-xs text-gray-400 font-medium mb-1">Next period expected</Text>
          <Text className="text-4xl font-extrabold text-gray-800">
            {formatDisplay(toISODate(nextPeriodDate))}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-8 right-6 bg-pink-brand rounded-full px-7 py-4"
        style={{ shadowColor: '#E91E8C', shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 }}
        onPress={() => router.push(`/log/${toISODate(new Date())}`)}
        activeOpacity={0.85}
      >
        <Text className="text-white font-extrabold text-base">+ Log Today</Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Verify in the running app**

Navigate to the Home tab. Confirm:
- Pink background
- "Your cycle" heading is pink and bold
- Three white cards with pink shadow
- Pink FAB (floating action button) bottom-right

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/home.tsx
git commit -m "feat: migrate home screen to NativeWind v4"
```

---

## Task 5: Migrate `app/(tabs)/calendar.tsx`

**Files:**
- Modify: `app/(tabs)/calendar.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  calculateOvulation,
  getFertileWindow,
} from '../../src/utils/prediction';
import { toISODate, addDays, fromISODate } from '../../src/utils/date';

type DotMarking = {
  selected?: boolean;
  selectedColor?: string;
  marked?: boolean;
  dotColor?: string;
};

type MarkedDates = Record<string, DotMarking>;

export default function CalendarScreen() {
  const settings = useAppStore((s) => s.settings);
  const cycles = useAppStore((s) => s.cycles);
  const logs = useAppStore((s) => s.logs);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};

    cycles.forEach((cycle) => {
      let d = fromISODate(cycle.startDate);
      const end = fromISODate(cycle.endDate);
      while (d <= end) {
        marks[toISODate(d)] = { selected: true, selectedColor: '#E91E8C' };
        d = addDays(d, 1);
      }
    });

    const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
    const ovulation = calculateOvulation(nextPeriod);
    const fertile = getFertileWindow(ovulation);

    let pd = nextPeriod;
    for (let i = 0; i < settings.periodDuration; i++) {
      const key = toISODate(pd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#FFB6C1' };
      pd = addDays(pd, 1);
    }

    let fd = fertile.start;
    while (fd <= fertile.end) {
      const key = toISODate(fd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#C8E6C9' };
      fd = addDays(fd, 1);
    }

    const ovKey = toISODate(ovulation);
    if (!marks[ovKey]) marks[ovKey] = { selected: true, selectedColor: '#FFF176' };

    logs.forEach((log) => {
      marks[log.date] = {
        ...(marks[log.date] ?? {}),
        marked: true,
        dotColor: '#555',
      };
    });

    return marks;
  }, [settings, cycles, logs]);

  return (
    <View className="flex-1 bg-pink-bg">
      <Calendar
        markedDates={markedDates}
        markingType="simple"
        onDayPress={(day) => router.push(`/log/${day.dateString}`)}
        theme={{
          backgroundColor: '#FFF0F5',
          calendarBackground: '#FFF0F5',
          todayTextColor: '#E91E8C',
          arrowColor: '#E91E8C',
          monthTextColor: '#333',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
        }}
        style={{ borderRadius: 12, margin: 12 }}
      />
      <View className="flex-row flex-wrap px-4 pt-2 gap-3">
        <LegendItem color="#E91E8C" label="Period" />
        <LegendItem color="#FFB6C1" label="Predicted" />
        <LegendItem color="#FFF176" label="Ovulation" />
        <LegendItem color="#C8E6C9" label="Fertile" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
  );
}
```

> Note: `Calendar` from `react-native-calendars` is not a standard RN View — its `style` and `theme` props stay as-is. Only the wrapper `View` and `LegendItem` use `className`. Dynamic `backgroundColor` in `LegendItem` stays as inline `style` since it varies per legend entry.

- [ ] **Step 2: Verify in the running app**

Navigate to the Calendar tab. Confirm:
- Pink background
- Calendar renders with pink highlights
- Legend row shows colored dots with labels

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/calendar.tsx
git commit -m "feat: migrate calendar screen to NativeWind v4"
```

---

## Task 6: Migrate `app/(tabs)/settings.tsx`

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Replace the file content**

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
```

- [ ] **Step 2: Verify in the running app**

Navigate to the Settings tab. Confirm:
- Inputs have correct borders and spacing
- "Save Changes" button is pink
- Divider line is visible
- "Reset All Data" is red-ish text

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat: migrate settings screen to NativeWind v4"
```

---

## Task 7: Migrate `app/log/[date].tsx`

**Files:**
- Modify: `app/log/[date].tsx`

- [ ] **Step 1: Replace the file content**

```tsx
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
```

- [ ] **Step 2: Verify in the running app**

Tap "+ Log Today" from home. Confirm:
- Date header is pink
- Mood/symptom/flow chips render as rounded pills
- Active chip turns pink with white text
- Notes textarea is functional
- Save button is pink

- [ ] **Step 3: Commit**

```bash
git add app/log/[date].tsx
git commit -m "feat: migrate log screen to NativeWind v4"
```

---

## Task 8: Final cleanup

**Files:**
- No new files

- [ ] **Step 1: Search for any remaining `StyleSheet` usage**

```bash
grep -r "StyleSheet" app/ --include="*.tsx"
```

Expected: no output (all StyleSheet.create blocks removed).

- [ ] **Step 2: Clear Metro cache and do a full test run**

```bash
npx expo start --clear
```

Navigate through all 5 screens (Onboarding → Home → Calendar → Settings → Log). Confirm no visual regressions, no red boxes, no missing styles.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all existing tests pass (tests are in `__tests__/utils/` and test pure utility functions, so no snapshot changes needed).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete NativeWind v4 migration, remove all StyleSheet.create blocks"
```
