# Menstrual Health Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a fully working offline-first menstrual health tracker React Native app using Expo SDK 51, Expo Router, Zustand, and AsyncStorage with zero peer dependency conflicts.

**Architecture:** File-based routing via Expo Router with a single Zustand store hydrated from AsyncStorage on app launch. All prediction logic is pure/deterministic utility functions. Screens are thin — they read from the store and call store actions.

**Tech Stack:** Expo SDK 51, React Native 0.74, Expo Router 3.5, TypeScript 5.3, Zustand 4.5, AsyncStorage 1.23, react-native-calendars 1.1306, expo-notifications 0.28

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Exact pinned deps, jest config, expo-router entry |
| `app.json` | Expo config — scheme, plugins (expo-router, expo-notifications) |
| `babel.config.js` | babel-preset-expo |
| `tsconfig.json` | Strict TS, expo base |
| `src/models/types.ts` | Settings, Cycle, DailyLog types |
| `src/utils/date.ts` | toISODate, fromISODate, addDays, diffInDays, formatDisplay |
| `src/utils/storage.ts` | AsyncStorage wrappers: getItem, setItem, removeItem, clearAll |
| `src/utils/prediction.ts` | calculateNextPeriod, calculateOvulation, getFertileWindow, getCurrentCycleDay, getDaysUntilNextPeriod |
| `src/utils/notifications.ts` | scheduleNotifications, cancelAllNotifications |
| `src/store/useAppStore.ts` | Single Zustand store: settings + cycles + logs + actions |
| `app/_layout.tsx` | Root Stack layout — store hydration, splash screen |
| `app/index.tsx` | Entry redirect: onboarding or (tabs)/home |
| `app/onboarding.tsx` | One-time setup screen |
| `app/(tabs)/_layout.tsx` | Bottom tab bar: Home, Calendar, Settings |
| `app/(tabs)/home.tsx` | Dashboard: cycle day, days until period, next period date, FAB |
| `app/(tabs)/calendar.tsx` | Monthly calendar with marked period/fertile/ovulation dates |
| `app/(tabs)/settings.tsx` | Edit cycle/period length, toggle notifications, reset data |
| `app/log/[date].tsx` | Daily log add/edit screen: mood, symptoms, flow, notes |
| `__tests__/utils/date.test.ts` | Unit tests for date utilities |
| `__tests__/utils/storage.test.ts` | Unit tests for storage utilities |
| `__tests__/utils/prediction.test.ts` | Unit tests for prediction utilities |

---

## Task 1: Bootstrap project — package.json, app.json, config files

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `babel.config.js`
- Create: `tsconfig.json`
- Create: `expo-env.d.ts`

- [ ] **Step 1: Create project directory and write package.json**

```bash
cd "D:\personal-projects\testing-ai-editors\claude-code\menstrual-health-tracker"
```

Write `package.json`:
```json
{
  "name": "menstrual-health-tracker",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "test": "jest --watchAll=false",
    "test:watch": "jest --watchAll"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "expo": "~51.0.0",
    "expo-linking": "~6.3.0",
    "expo-notifications": "~0.28.0",
    "expo-router": "~3.5.0",
    "expo-splash-screen": "~0.27.0",
    "expo-status-bar": "~1.12.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-calendars": "1.1306.0",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "~3.31.0",
    "zustand": "4.5.4"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@testing-library/react-native": "^12.4.0",
    "@types/react": "~18.2.79",
    "jest": "^29.7.0",
    "jest-expo": "~51.0.0",
    "typescript": "~5.3.0"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFiles": [
      "@react-native-async-storage/async-storage/jest/async-storage-mock"
    ],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-calendars|react-native-swipe-gestures)"
    ]
  }
}
```

- [ ] **Step 2: Write app.json**

```json
{
  "expo": {
    "name": "Menstrual Health Tracker",
    "slug": "menstrual-health-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "menstrualtracker",
    "userInterfaceStyle": "light",
    "splash": {
      "resizeMode": "contain",
      "backgroundColor": "#FFF0F5"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourname.menstrualtracker"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#FFF0F5"
      },
      "package": "com.yourname.menstrualtracker"
    },
    "plugins": [
      "expo-router",
      "expo-notifications"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 3: Write babel.config.js**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 4: Write tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts",
    "expo-env.d.ts"
  ]
}
```

- [ ] **Step 5: Write expo-env.d.ts**

```ts
/// <reference types="expo/types" />
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected: All packages install with no peer dependency warnings. If you see warnings about `react-native-calendars`, they are safe to ignore — the package works correctly with RN 0.74.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json app.json babel.config.js tsconfig.json expo-env.d.ts
git commit -m "feat: initialize Expo SDK 51 project with pinned dependencies"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/models/types.ts`

- [ ] **Step 1: Create src/models/types.ts**

```ts
export type Settings = {
  cycleLength: number;
  periodDuration: number;
  lastPeriodStart: string; // ISO date string: YYYY-MM-DD
  hasOnboarded: boolean;
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
};
```

- [ ] **Step 2: Commit**

```bash
git add src/models/types.ts
git commit -m "feat: add TypeScript data models"
```

---

## Task 3: Date utilities (TDD)

**Files:**
- Create: `src/utils/date.ts`
- Test: `__tests__/utils/date.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/utils/date.test.ts`:

```ts
import { toISODate, fromISODate, addDays, diffInDays, formatDisplay } from '../../src/utils/date';

describe('date utils', () => {
  describe('toISODate', () => {
    it('formats a Date as YYYY-MM-DD', () => {
      // Use UTC to avoid timezone flakiness
      const d = new Date('2024-03-15T12:00:00Z');
      expect(toISODate(d)).toBe('2024-03-15');
    });
  });

  describe('fromISODate', () => {
    it('parses YYYY-MM-DD into a local midnight Date', () => {
      const d = fromISODate('2024-03-15');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(2); // 0-indexed
      expect(d.getDate()).toBe(15);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const result = addDays(fromISODate('2024-01-01'), 10);
      expect(toISODate(result)).toBe('2024-01-11');
    });

    it('subtracts days when negative', () => {
      const result = addDays(fromISODate('2024-01-15'), -5);
      expect(toISODate(result)).toBe('2024-01-10');
    });

    it('crosses month boundaries', () => {
      const result = addDays(fromISODate('2024-01-29'), 5);
      expect(toISODate(result)).toBe('2024-02-03');
    });
  });

  describe('diffInDays', () => {
    it('returns full days between two dates (b - a)', () => {
      const a = fromISODate('2024-01-01');
      const b = fromISODate('2024-01-11');
      expect(diffInDays(a, b)).toBe(10);
    });

    it('returns negative when b is before a', () => {
      const a = fromISODate('2024-01-11');
      const b = fromISODate('2024-01-01');
      expect(diffInDays(a, b)).toBe(-10);
    });
  });

  describe('formatDisplay', () => {
    it('returns a human-readable date string', () => {
      const result = formatDisplay('2024-03-15');
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest __tests__/utils/date.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/utils/date'`

- [ ] **Step 3: Implement src/utils/date.ts**

```ts
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function fromISODate(dateStr: string): Date {
  // Parse as local midnight to avoid UTC offset shifting the date
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function diffInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bUTC - aUTC) / MS_PER_DAY);
}

export function formatDisplay(dateStr: string): string {
  const date = fromISODate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx jest __tests__/utils/date.test.ts --no-coverage
```

Expected: PASS — 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/date.ts __tests__/utils/date.test.ts
git commit -m "feat: add date utilities with tests"
```

---

## Task 4: Storage utilities (TDD)

**Files:**
- Create: `src/utils/storage.ts`
- Test: `__tests__/utils/storage.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/utils/storage.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, setItem, removeItem, clearAll, KEYS } from '../../src/utils/storage';

describe('storage utils', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('setItem serializes and getItem deserializes an object', async () => {
    await setItem(KEYS.SETTINGS, { cycleLength: 30 });
    const result = await getItem<{ cycleLength: number }>(KEYS.SETTINGS);
    expect(result?.cycleLength).toBe(30);
  });

  it('getItem returns null for a missing key', async () => {
    const result = await getItem('__nonexistent__');
    expect(result).toBeNull();
  });

  it('removeItem deletes a stored key', async () => {
    await setItem(KEYS.SETTINGS, { cycleLength: 30 });
    await removeItem(KEYS.SETTINGS);
    const result = await getItem(KEYS.SETTINGS);
    expect(result).toBeNull();
  });

  it('clearAll removes settings, cycles, and logs', async () => {
    await setItem(KEYS.SETTINGS, { cycleLength: 28 });
    await setItem(KEYS.CYCLES, [{ id: '1' }]);
    await setItem(KEYS.LOGS, [{ id: '2' }]);
    await clearAll();
    expect(await getItem(KEYS.SETTINGS)).toBeNull();
    expect(await getItem(KEYS.CYCLES)).toBeNull();
    expect(await getItem(KEYS.LOGS)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest __tests__/utils/storage.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/utils/storage'`

- [ ] **Step 3: Implement src/utils/storage.ts**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  SETTINGS: '@settings',
  CYCLES: '@cycles',
  LOGS: '@logs',
} as const;

export async function getItem<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);
  if (value === null) return null;
  return JSON.parse(value) as T;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.SETTINGS, KEYS.CYCLES, KEYS.LOGS]);
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx jest __tests__/utils/storage.test.ts --no-coverage
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/storage.ts __tests__/utils/storage.test.ts
git commit -m "feat: add AsyncStorage utilities with tests"
```

---

## Task 5: Prediction logic (TDD)

**Files:**
- Create: `src/utils/prediction.ts`
- Test: `__tests__/utils/prediction.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/utils/prediction.test.ts`:

```ts
import {
  calculateNextPeriod,
  calculateOvulation,
  getFertileWindow,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
} from '../../src/utils/prediction';
import { toISODate } from '../../src/utils/date';

describe('prediction utils', () => {
  const lastPeriodStart = '2024-01-01';
  const cycleLength = 28;

  describe('calculateNextPeriod', () => {
    it('returns lastPeriodStart + cycleLength days', () => {
      const result = calculateNextPeriod(lastPeriodStart, cycleLength);
      expect(toISODate(result)).toBe('2024-01-29');
    });

    it('handles cycle length of 30', () => {
      const result = calculateNextPeriod('2024-01-01', 30);
      expect(toISODate(result)).toBe('2024-01-31');
    });
  });

  describe('calculateOvulation', () => {
    it('is 14 days before next period', () => {
      const nextPeriod = calculateNextPeriod(lastPeriodStart, cycleLength);
      const result = calculateOvulation(nextPeriod);
      expect(toISODate(result)).toBe('2024-01-15');
    });
  });

  describe('getFertileWindow', () => {
    it('returns ovulation ± 2 days', () => {
      const nextPeriod = calculateNextPeriod(lastPeriodStart, cycleLength);
      const ovulation = calculateOvulation(nextPeriod);
      const { start, end } = getFertileWindow(ovulation);
      expect(toISODate(start)).toBe('2024-01-13');
      expect(toISODate(end)).toBe('2024-01-17');
    });
  });

  describe('getCurrentCycleDay', () => {
    it('returns 1 when last period started today', () => {
      const today = toISODate(new Date());
      expect(getCurrentCycleDay(today)).toBe(1);
    });

    it('returns correct day for a known past date', () => {
      // Fix "today" by mocking Date
      const realDate = global.Date;
      const mockNow = new Date('2024-01-15T12:00:00');
      global.Date = class extends realDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockNow.getTime());
          } else {
            // @ts-ignore
            super(...args);
          }
        }
        static now() { return mockNow.getTime(); }
      } as any;

      expect(getCurrentCycleDay('2024-01-01')).toBe(15);

      global.Date = realDate;
    });
  });

  describe('getDaysUntilNextPeriod', () => {
    it('returns cycleLength when called on the same day as lastPeriodStart', () => {
      const today = toISODate(new Date());
      const result = getDaysUntilNextPeriod(today, 28);
      expect(result).toBe(28);
    });
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest __tests__/utils/prediction.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/utils/prediction'`

- [ ] **Step 3: Implement src/utils/prediction.ts**

```ts
import { addDays, fromISODate, diffInDays } from './date';

export function calculateNextPeriod(lastPeriodStart: string, cycleLength: number): Date {
  return addDays(fromISODate(lastPeriodStart), cycleLength);
}

export function calculateOvulation(nextPeriod: Date): Date {
  return addDays(nextPeriod, -14);
}

export function getFertileWindow(ovulation: Date): { start: Date; end: Date } {
  return {
    start: addDays(ovulation, -2),
    end: addDays(ovulation, 2),
  };
}

export function getCurrentCycleDay(lastPeriodStart: string): number {
  const start = fromISODate(lastPeriodStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return diffInDays(start, today) + 1;
}

export function getDaysUntilNextPeriod(lastPeriodStart: string, cycleLength: number): number {
  const nextPeriod = calculateNextPeriod(lastPeriodStart, cycleLength);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return diffInDays(today, nextPeriod);
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx jest __tests__/utils/prediction.test.ts --no-coverage
```

Expected: PASS — 6 tests pass

- [ ] **Step 5: Run full test suite to confirm nothing broken**

```bash
npx jest --no-coverage
```

Expected: All tests pass across date, storage, prediction suites

- [ ] **Step 6: Commit**

```bash
git add src/utils/prediction.ts __tests__/utils/prediction.test.ts
git commit -m "feat: add prediction logic with tests"
```

---

## Task 6: Zustand store

**Files:**
- Create: `src/store/useAppStore.ts`

- [ ] **Step 1: Create src/store/useAppStore.ts**

```ts
import { create } from 'zustand';
import { Settings, Cycle, DailyLog, DEFAULT_SETTINGS } from '../models/types';
import { getItem, setItem, clearAll, KEYS } from '../utils/storage';

interface AppState {
  settings: Settings;
  cycles: Cycle[];
  logs: DailyLog[];
  hydrated: boolean;
  loadFromStorage: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  addCycle: (cycle: Cycle) => Promise<void>;
  updateCycle: (cycle: Cycle) => Promise<void>;
  addLog: (log: DailyLog) => Promise<void>;
  updateLog: (log: DailyLog) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  cycles: [],
  logs: [],
  hydrated: false,

  loadFromStorage: async () => {
    const [settings, cycles, logs] = await Promise.all([
      getItem<Settings>(KEYS.SETTINGS),
      getItem<Cycle[]>(KEYS.CYCLES),
      getItem<DailyLog[]>(KEYS.LOGS),
    ]);
    set({
      settings: settings ?? DEFAULT_SETTINGS,
      cycles: cycles ?? [],
      logs: logs ?? [],
      hydrated: true,
    });
  },

  updateSettings: async (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    await setItem(KEYS.SETTINGS, updated);
  },

  addCycle: async (cycle) => {
    const cycles = [...get().cycles, cycle];
    set({ cycles });
    await setItem(KEYS.CYCLES, cycles);
  },

  updateCycle: async (cycle) => {
    const cycles = get().cycles.map((c) => (c.id === cycle.id ? cycle : c));
    set({ cycles });
    await setItem(KEYS.CYCLES, cycles);
  },

  addLog: async (log) => {
    const logs = [...get().logs, log];
    set({ logs });
    await setItem(KEYS.LOGS, logs);
  },

  updateLog: async (log) => {
    const logs = get().logs.map((l) => (l.id === log.id ? log : l));
    set({ logs });
    await setItem(KEYS.LOGS, logs);
  },

  deleteLog: async (id) => {
    const logs = get().logs.filter((l) => l.id !== id);
    set({ logs });
    await setItem(KEYS.LOGS, logs);
  },

  resetAll: async () => {
    await clearAll();
    set({
      settings: { ...DEFAULT_SETTINGS, lastPeriodStart: new Date().toISOString().split('T')[0] },
      cycles: [],
      logs: [],
      hydrated: false,
    });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/useAppStore.ts
git commit -m "feat: add Zustand store with AsyncStorage persistence"
```

---

## Task 7: App navigation skeleton

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create app/_layout.tsx**

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '../src/store/useAppStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    loadFromStorage().then(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (!hydrated) return null;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="log/[date]"
        options={{ title: 'Daily Log', presentation: 'modal', headerTintColor: '#E91E8C' }}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Create app/index.tsx**

```tsx
import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';

export default function Index() {
  const hasOnboarded = useAppStore((s) => s.settings.hasOnboarded);
  return <Redirect href={hasOnboarded ? '/(tabs)/home' : '/onboarding'} />;
}
```

- [ ] **Step 3: Create app/(tabs)/_layout.tsx**

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E91E8C',
        tabBarInactiveTintColor: '#BBB',
        tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#F0E0E8' },
        headerStyle: { backgroundColor: '#FFF0F5' },
        headerTintColor: '#E91E8C',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarIcon: tabIcon('calendar') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('settings') }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/index.tsx "app/(tabs)/_layout.tsx"
git commit -m "feat: add app navigation skeleton with Expo Router"
```

---

## Task 8: Onboarding screen

**Files:**
- Create: `app/onboarding.tsx`

- [ ] **Step 1: Create app/onboarding.tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: add onboarding screen"
```

---

## Task 9: Home (Dashboard) screen

**Files:**
- Create: `app/(tabs)/home.tsx`

- [ ] **Step 1: Create app/(tabs)/home.tsx**

```tsx
import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Your cycle</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current cycle day</Text>
          <Text style={styles.cardValue}>{cycleDay}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Days until next period</Text>
          <Text style={styles.cardValue}>{daysUntilLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Next period expected</Text>
          <Text style={styles.cardValue}>{formatDisplay(toISODate(nextPeriodDate))}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/log/${toISODate(new Date())}`)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Log Today</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  scroll: { padding: 24, paddingBottom: 100 },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#E91E8C',
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#E91E8C',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: { fontSize: 13, color: '#AAA', marginBottom: 6, fontWeight: '500' },
  cardValue: { fontSize: 30, fontWeight: '800', color: '#2D2D2D' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#E91E8C',
    borderRadius: 36,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowColor: '#E91E8C',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  fabText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/home.tsx"
git commit -m "feat: add home dashboard screen"
```

---

## Task 10: Calendar screen

**Files:**
- Create: `app/(tabs)/calendar.tsx`

- [ ] **Step 1: Create app/(tabs)/calendar.tsx**

```tsx
import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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

    // Logged period days (actual)
    cycles.forEach((cycle) => {
      let d = fromISODate(cycle.startDate);
      const end = fromISODate(cycle.endDate);
      while (d <= end) {
        marks[toISODate(d)] = { selected: true, selectedColor: '#E91E8C' };
        d = addDays(d, 1);
      }
    });

    // Predictions
    const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
    const ovulation = calculateOvulation(nextPeriod);
    const fertile = getFertileWindow(ovulation);

    // Predicted period days
    let pd = nextPeriod;
    for (let i = 0; i < settings.periodDuration; i++) {
      const key = toISODate(pd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#FFB6C1' };
      pd = addDays(pd, 1);
    }

    // Fertile window
    let fd = fertile.start;
    while (fd <= fertile.end) {
      const key = toISODate(fd);
      if (!marks[key]) marks[key] = { selected: true, selectedColor: '#C8E6C9' };
      fd = addDays(fd, 1);
    }

    // Ovulation (drawn after fertile window so it takes priority)
    const ovKey = toISODate(ovulation);
    if (!marks[ovKey]) marks[ovKey] = { selected: true, selectedColor: '#FFF176' };

    // Daily log dots — overlay on top of existing marks
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
    <View style={styles.container}>
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
        style={styles.calendar}
      />
      <View style={styles.legend}>
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
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  calendar: { borderRadius: 12, margin: 12 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13, color: '#666' },
});
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/calendar.tsx"
git commit -m "feat: add calendar screen with period/fertile/ovulation markers"
```

---

## Task 11: Daily Log screen

**Files:**
- Create: `app/log/[date].tsx`

- [ ] **Step 1: Create app/log/[date].tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/log/[date].tsx"
git commit -m "feat: add daily log screen with mood/symptoms/flow/notes"
```

---

## Task 12: Settings screen

**Files:**
- Create: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Create app/(tabs)/settings.tsx**

```tsx
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
          onValueChange={setNotificationsEnabled}
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/settings.tsx"
git commit -m "feat: add settings screen with save and reset"
```

---

## Task 13: Local notifications utility

**Files:**
- Create: `src/utils/notifications.ts`

- [ ] **Step 1: Create src/utils/notifications.ts**

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function schedulePeriodReminder(nextPeriodDate: Date): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Remind 2 days before
  const reminderDate = new Date(nextPeriodDate);
  reminderDate.setDate(reminderDate.getDate() - 2);
  reminderDate.setHours(9, 0, 0, 0);

  if (reminderDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Period reminder',
        body: 'Your period is expected in 2 days.',
        sound: true,
      },
      trigger: { date: reminderDate },
    });
  }
}

export async function scheduleDailyLogReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily check-in',
      body: 'How are you feeling today? Tap to log.',
      sound: true,
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

- [ ] **Step 2: Wire notifications into Settings screen**

In `app/(tabs)/settings.tsx`, add the import at the top:

```tsx
import {
  requestNotificationPermissions,
  schedulePeriodReminder,
  scheduleDailyLogReminder,
  cancelAllNotifications,
} from '../../src/utils/notifications';
import { calculateNextPeriod } from '../../src/utils/prediction';
```

Replace the `onValueChange` handler for the Switch:

```tsx
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
```

- [ ] **Step 3: Run all tests to confirm everything still passes**

```bash
npx jest --no-coverage
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/utils/notifications.ts "app/(tabs)/settings.tsx"
git commit -m "feat: add local notifications for period reminder and daily log"
```

---

## Task 14: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npx jest --no-coverage
```

Expected output:
```
PASS __tests__/utils/date.test.ts
PASS __tests__/utils/storage.test.ts
PASS __tests__/utils/prediction.test.ts

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
```

- [ ] **Step 2: Start the app and verify it boots**

```bash
npx expo start
```

Expected: QR code appears, no compilation errors in the terminal. Scan with Expo Go to verify the onboarding screen loads on first launch.

- [ ] **Step 3: Verify onboarding → home flow**

1. App opens → Onboarding screen shown (because `hasOnboarded` is false)
2. Fill in values and tap "Get Started" → Home screen shown with cycle day, days until period, next period date
3. Kill and reopen app → Home screen loads directly (no onboarding again)

- [ ] **Step 4: Verify calendar and log flow**

1. Tap Calendar tab → monthly calendar with color markers
2. Tap any date → Daily Log screen opens as modal
3. Select mood, symptoms, flow, add notes → tap Save
4. Return to calendar → tapped date now has a dot marker

- [ ] **Step 5: Verify settings and reset**

1. Tap Settings → edit cycle length → Save → verify home screen predictions update
2. Tap "Reset All Data" → confirm → onboarding screen shown

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: complete menstrual health tracker scaffold"
```
