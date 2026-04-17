# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all screens with a dual light/dark theme system, custom floating tab bar, SVG cycle ring hero, and custom calendar component.

**Architecture:** A thin theme layer (`src/theme/index.ts`) provides color tokens and a `useTheme()` hook via React Context. All screens are rebuilt using inline styles with those tokens. Three new standalone components (`CycleRing`, `FloatingTabBar`, `CalendarView`) handle the visual-heavy pieces. NativeWind/Tailwind is removed entirely.

**Tech Stack:** React Native, Expo Router, Zustand, AsyncStorage (existing), react-native-svg (new), react-native-reanimated (existing), @react-native-async-storage/async-storage (existing), @react-navigation/bottom-tabs (existing transitive dep)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/theme/index.ts` | Color palettes, ThemeProvider, useTheme hook, withOpacity util |
| Create | `src/components/CycleRing.tsx` | SVG cycle progress ring |
| Create | `src/components/FloatingTabBar.tsx` | Custom animated pill tab bar |
| Create | `src/components/CalendarView.tsx` | Custom monthly calendar grid |
| Modify | `src/utils/date.ts` | Add formatShort, formatFull, formatHeader, formatMonthYear; remove formatDisplay |
| Modify | `src/utils/prediction.ts` | Add getCurrentPhase |
| Modify | `app/_layout.tsx` | Add ThemeProvider, remove global.css import |
| Modify | `app/(tabs)/_layout.tsx` | Wire FloatingTabBar, remove NativeWind styles |
| Modify | `app/(tabs)/home.tsx` | New layout with CycleRing + stat pills |
| Modify | `app/(tabs)/calendar.tsx` | Replace react-native-calendars with CalendarView |
| Modify | `app/(tabs)/settings.tsx` | Add Appearance / theme toggle section |
| Modify | `app/log/[date].tsx` | New header, emoji chips, flow bar |
| Modify | `app/onboarding.tsx` | Apply theme tokens, fix date display |
| Modify | `babel.config.js` | Remove jsxImportSource: 'nativewind' |
| Modify | `tsconfig.json` | Remove nativewind-env.d.ts from include |
| Delete | `tailwind.config.js` | No longer needed |
| Delete | `global.css` | No longer needed |
| Delete | `nativewind-env.d.ts` | No longer needed |
| Modify | `__tests__/utils/date.test.ts` | Update for new formatters |
| Create | `__tests__/utils/prediction-phase.test.ts` | Tests for getCurrentPhase |

---

## Task 1: Remove NativeWind/Tailwind/Calendars, install react-native-svg

**Files:**
- Modify: `babel.config.js`
- Modify: `tsconfig.json`
- Delete: `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`

- [ ] **Step 1: Install react-native-svg**

```bash
cd menstrual-health-tracker
npx expo install react-native-svg
```

Expected: package added to package.json, no errors.

- [ ] **Step 2: Uninstall NativeWind, Tailwind, react-native-calendars**

```bash
npm uninstall nativewind tailwindcss react-native-calendars
```

- [ ] **Step 3: Update babel.config.js — remove jsxImportSource**

Replace the entire file:

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { unstable_transformImportMeta: true }],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 4: Update tsconfig.json — remove nativewind-env.d.ts**

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
    "expo-env.d.ts",
    ".expo/types/**/*.ts"
  ]
}
```

- [ ] **Step 5: Delete unneeded files**

```bash
rm tailwind.config.js global.css nativewind-env.d.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove NativeWind/Tailwind/react-native-calendars, add react-native-svg"
```

---

## Task 2: Create theme system

**Files:**
- Create: `src/theme/index.ts`

- [ ] **Step 1: Create `src/theme/index.ts`**

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  brand: string;
  accent: string;
  period: string;
  fertile: string;
  ovulation: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

const lightColors: ThemeColors = {
  background: '#FFF8F5',
  surface: '#FFFFFF',
  brand: '#D64F7A',
  accent: '#FF8FA3',
  period: '#E8547A',
  fertile: '#7BC67E',
  ovulation: '#FFB347',
  textPrimary: '#1A1A2E',
  textSecondary: '#9B8A9B',
  border: '#F0DDE8',
};

const darkColors: ThemeColors = {
  background: '#0D0B14',
  surface: '#1A1625',
  brand: '#E8547A',
  accent: '#C084A0',
  period: '#E8547A',
  fertile: '#4CAF7D',
  ovulation: '#F0A843',
  textPrimary: '#F5E6FF',
  textSecondary: '#8B7DA8',
  border: '#2D2540',
};

const THEME_KEY = '@theme_preference';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  scheme: 'light',
  preference: 'system',
  setPreference: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useColorScheme() ?? 'light') as ColorScheme;
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setPreferenceState(val);
      }
    });
  }, []);

  const scheme: ColorScheme = preference === 'system' ? systemScheme : preference;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const setPreference = async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(THEME_KEY, p);
  };

  return (
    <ThemeContext.Provider value={{ colors, scheme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Convert a hex color to rgba string with given opacity (0–1). */
export function withOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat: add theme system with light/dark palettes and useTheme hook"
```

---

## Task 3: Update date utils — new formatters + tests

**Files:**
- Modify: `src/utils/date.ts`
- Modify: `__tests__/utils/date.test.ts`

- [ ] **Step 1: Write failing tests first**

Replace `__tests__/utils/date.test.ts`:

```typescript
import {
  toISODate,
  fromISODate,
  addDays,
  diffInDays,
  formatShort,
  formatFull,
  formatHeader,
  formatMonthYear,
} from '../../src/utils/date';

describe('date utils', () => {
  describe('toISODate', () => {
    it('formats a Date as YYYY-MM-DD', () => {
      const d = new Date('2024-03-15T12:00:00Z');
      expect(toISODate(d)).toBe('2024-03-15');
    });
  });

  describe('fromISODate', () => {
    it('parses YYYY-MM-DD into a local midnight Date', () => {
      const d = fromISODate('2024-03-15');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(15);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      expect(toISODate(addDays(fromISODate('2024-01-01'), 10))).toBe('2024-01-11');
    });

    it('subtracts days when negative', () => {
      expect(toISODate(addDays(fromISODate('2024-01-15'), -5))).toBe('2024-01-10');
    });

    it('crosses month boundaries', () => {
      expect(toISODate(addDays(fromISODate('2024-01-29'), 5))).toBe('2024-02-03');
    });
  });

  describe('diffInDays', () => {
    it('returns full days between two dates (b - a)', () => {
      expect(diffInDays(fromISODate('2024-01-01'), fromISODate('2024-01-11'))).toBe(10);
    });

    it('returns negative when b is before a', () => {
      expect(diffInDays(fromISODate('2024-01-11'), fromISODate('2024-01-01'))).toBe(-10);
    });
  });

  describe('formatShort', () => {
    it('returns month abbreviation and day number', () => {
      const result = formatShort('2024-03-15');
      expect(result).toContain('Mar');
      expect(result).toContain('15');
    });
  });

  describe('formatFull', () => {
    it('returns full month, day and year', () => {
      const result = formatFull('2024-03-15');
      expect(result).toContain('March');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatHeader', () => {
    it('returns weekday, full month and day', () => {
      // 2024-03-15 is a Friday
      const result = formatHeader('2024-03-15');
      expect(result).toContain('Friday');
      expect(result).toContain('March');
      expect(result).toContain('15');
    });
  });

  describe('formatMonthYear', () => {
    it('returns full month and year', () => {
      const result = formatMonthYear('2024-03-15');
      expect(result).toContain('March');
      expect(result).toContain('2024');
    });
  });
});
```

- [ ] **Step 2: Run tests — expect failures for new formatters**

```bash
npm test -- --testPathPattern="date" --watchAll=false
```

Expected: failures on formatShort, formatFull, formatHeader, formatMonthYear (not exported yet).

- [ ] **Step 3: Update `src/utils/date.ts` — add new formatters, remove formatDisplay**

```typescript
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODate(dateStr: string): Date {
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

/** "Mar 15" */
export function formatShort(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** "March 15, 2024" */
export function formatFull(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Friday, March 15" */
export function formatHeader(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** "March 2024" */
export function formatMonthYear(dateStr: string): string {
  return fromISODate(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
```

- [ ] **Step 4: Run tests — all must pass**

```bash
npm test -- --testPathPattern="date" --watchAll=false
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/date.ts __tests__/utils/date.test.ts
git commit -m "feat: replace formatDisplay with purpose-built date formatters"
```

---

## Task 4: Add getCurrentPhase to prediction utils

**Files:**
- Modify: `src/utils/prediction.ts`
- Create: `__tests__/utils/prediction-phase.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/utils/prediction-phase.test.ts`:

```typescript
import { getCurrentPhase } from '../../src/utils/prediction';

describe('getCurrentPhase', () => {
  // cycleLength=28, periodDuration=5, ovulationDay=14

  it('returns "Period" during period days', () => {
    expect(getCurrentPhase(1, 28, 5)).toBe('Period');
    expect(getCurrentPhase(5, 28, 5)).toBe('Period');
  });

  it('returns "Follicular" after period before fertile window', () => {
    expect(getCurrentPhase(6, 28, 5)).toBe('Follicular');
    expect(getCurrentPhase(11, 28, 5)).toBe('Follicular');
  });

  it('returns "Fertile Window" for days around ovulation', () => {
    expect(getCurrentPhase(12, 28, 5)).toBe('Fertile Window');
    expect(getCurrentPhase(13, 28, 5)).toBe('Fertile Window');
    expect(getCurrentPhase(15, 28, 5)).toBe('Fertile Window');
    expect(getCurrentPhase(16, 28, 5)).toBe('Fertile Window');
  });

  it('returns "Ovulation" on ovulation day', () => {
    expect(getCurrentPhase(14, 28, 5)).toBe('Ovulation');
  });

  it('returns "Luteal" after ovulation', () => {
    expect(getCurrentPhase(17, 28, 5)).toBe('Luteal');
    expect(getCurrentPhase(28, 28, 5)).toBe('Luteal');
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test -- --testPathPattern="prediction-phase" --watchAll=false
```

Expected: FAIL — `getCurrentPhase` not exported.

- [ ] **Step 3: Add getCurrentPhase to `src/utils/prediction.ts`**

Append to the existing file (keep all existing exports):

```typescript
/**
 * Returns the named phase for a given cycle day.
 * ovulationDay = cycleLength - 14
 * fertileWindow = ovulationDay ± 2 (excluding ovulation day itself)
 */
export function getCurrentPhase(
  cycleDay: number,
  cycleLength: number,
  periodDuration: number,
): string {
  const ovulationDay = cycleLength - 14;
  if (cycleDay <= periodDuration) return 'Period';
  if (cycleDay === ovulationDay) return 'Ovulation';
  if (cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay + 2) return 'Fertile Window';
  if (cycleDay < ovulationDay - 2) return 'Follicular';
  return 'Luteal';
}
```

- [ ] **Step 4: Run test — all must pass**

```bash
npm test -- --testPathPattern="prediction-phase" --watchAll=false
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/prediction.ts __tests__/utils/prediction-phase.test.ts
git commit -m "feat: add getCurrentPhase to prediction utils"
```

---

## Task 5: Wrap app in ThemeProvider

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update `app/_layout.tsx`**

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '../src/store/useAppStore';
import { ThemeProvider, useTheme } from '../src/theme';

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

  useEffect(() => {
    loadFromStorage().then(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (!hydrated) return null;

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Start Expo and verify app loads**

```bash
npx expo start
```

Expected: app launches, no red errors. (Screens will look broken until redesigned — that's fine.)

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wrap app in ThemeProvider"
```

---

## Task 6: Create CycleRing component

**Files:**
- Create: `src/components/CycleRing.tsx`

- [ ] **Step 1: Create `src/components/CycleRing.tsx`**

```typescript
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { useTheme, withOpacity } from '../theme';

interface CycleRingProps {
  cycleDay: number;
  cycleLength: number;
  periodDuration: number;
  phase: string;
}

const SIZE = 260;
const C = SIZE / 2; // center x & y = 130
const R = 95;       // ring radius
const SW = 20;      // stroke width

function polarToXY(angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + R * Math.cos(rad), y: C + R * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number): string {
  // Clamp to avoid degenerate arcs
  if (endDeg - startDeg <= 0) return '';
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.9;
  const s = polarToXY(startDeg);
  const e = polarToXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function dayToDeg(day: number, cycleLength: number): number {
  return ((day - 1) / cycleLength) * 360;
}

export function CycleRing({ cycleDay, cycleLength, periodDuration, phase }: CycleRingProps) {
  const { colors } = useTheme();
  const ovDay = cycleLength - 14;

  // Phase arc bounds (degrees)
  const periodStart = dayToDeg(1, cycleLength);
  const periodEnd = dayToDeg(periodDuration + 1, cycleLength);
  const fertileStart = dayToDeg(Math.max(ovDay - 2, periodDuration + 1), cycleLength);
  const fertileEnd = dayToDeg(ovDay + 3, cycleLength);
  const ovStart = dayToDeg(ovDay, cycleLength);
  const ovEnd = dayToDeg(ovDay + 1, cycleLength);

  // Progress arc
  const progressDeg = Math.min((cycleDay / cycleLength) * 360, 359.9);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background track */}
        <Circle
          cx={C}
          cy={C}
          r={R}
          stroke={withOpacity(colors.border, 0.6)}
          strokeWidth={SW}
          fill="none"
        />

        {/* Period zone */}
        {periodEnd > periodStart && (
          <Path
            d={arcPath(periodStart, periodEnd)}
            stroke={colors.period}
            strokeWidth={SW}
            strokeOpacity={0.3}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Fertile zone */}
        {fertileEnd > fertileStart && (
          <Path
            d={arcPath(fertileStart, fertileEnd)}
            stroke={colors.fertile}
            strokeWidth={SW}
            strokeOpacity={0.35}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Ovulation marker */}
        <Path
          d={arcPath(ovStart, ovEnd)}
          stroke={colors.ovulation}
          strokeWidth={SW}
          strokeOpacity={0.7}
          fill="none"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {progressDeg > 0 && (
          <Path
            d={arcPath(0, progressDeg)}
            stroke={colors.brand}
            strokeWidth={SW}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Center: day number */}
        <SvgText
          x={C}
          y={C + 16}
          textAnchor="middle"
          fill={colors.textPrimary}
          fontSize="52"
          fontWeight="800"
        >
          {cycleDay}
        </SvgText>

        {/* Center: phase label */}
        <SvgText
          x={C}
          y={C + 38}
          textAnchor="middle"
          fill={colors.textSecondary}
          fontSize="12"
          fontWeight="500"
        >
          {phase.toUpperCase()}
        </SvgText>

        {/* "DAY" label above number */}
        <SvgText
          x={C}
          y={C - 12}
          textAnchor="middle"
          fill={colors.textSecondary}
          fontSize="11"
          fontWeight="600"
          letterSpacing="2"
        >
          DAY
        </SvgText>
      </Svg>
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CycleRing.tsx
git commit -m "feat: add CycleRing SVG component"
```

---

## Task 7: Create FloatingTabBar component

**Files:**
- Create: `src/components/FloatingTabBar.tsx`

- [ ] **Step 1: Create `src/components/FloatingTabBar.tsx`**

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme, withOpacity } from '../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { outline: IoniconsName; filled: IoniconsName; label: string }> = {
  home:     { outline: 'home-outline',     filled: 'home',     label: 'Home' },
  calendar: { outline: 'calendar-outline', filled: 'calendar', label: 'Calendar' },
  settings: { outline: 'settings-outline', filled: 'settings', label: 'Settings' },
};

const PILL_HEIGHT = 60;
const BOTTOM_MARGIN = 20;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tabWidth, setTabWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(indicatorX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [state.index, tabWidth]);

  const totalTabs = state.routes.length;

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + BOTTOM_MARGIN },
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surface,
            boxShadow: `0 8px 32px ${withOpacity(colors.brand, 0.18)}`,
            borderColor: withOpacity(colors.border, 0.6),
          },
        ]}
        onLayout={(e) => setTabWidth(e.nativeEvent.layout.width / totalTabs)}
      >
        {/* Sliding active indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth - 12,
                height: PILL_HEIGHT - 12,
                backgroundColor: withOpacity(colors.brand, 0.12),
                transform: [
                  {
                    translateX: Animated.add(
                      indicatorX,
                      new Animated.Value(6),
                    ),
                  },
                ],
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            outline: 'ellipse-outline' as IoniconsName,
            filled: 'ellipse' as IoniconsName,
            label: route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            >
              <Ionicons
                name={isFocused ? config.filled : config.outline}
                size={22}
                color={isFocused ? colors.brand : colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  fontWeight: isFocused ? '700' : '400',
                  color: isFocused ? colors.brand : colors.textSecondary,
                }}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    height: PILL_HEIGHT,
    width: '75%',
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    borderRadius: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FloatingTabBar.tsx
git commit -m "feat: add FloatingTabBar custom animated pill tab bar"
```

---

## Task 8: Wire FloatingTabBar in tabs layout

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Replace `app/(tabs)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../src/components/FloatingTabBar';
import { useTheme } from '../../src/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.brand,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        tabBarStyle: { display: 'none' }, // suppress default tab bar
      }}
    >
      <Tabs.Screen name="home"     options={{ title: 'Home' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Visual check in Expo Go**

Run the app. The floating pill tab bar should appear at the bottom. Tapping tabs should navigate. Active tab highlights in brand color.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: wire FloatingTabBar into tabs layout"
```

---

## Task 9: Redesign Home screen

**Files:**
- Modify: `app/(tabs)/home.tsx`

- [ ] **Step 1: Replace `app/(tabs)/home.tsx`**

```typescript
import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
  getCurrentPhase,
} from '../../src/utils/prediction';
import { toISODate, formatShort } from '../../src/utils/date';
import { useTheme, withOpacity } from '../../src/theme';
import { CycleRing } from '../../src/components/CycleRing';

export default function Home() {
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);

  const cycleDay = useMemo(
    () => getCurrentCycleDay(settings.lastPeriodStart),
    [settings.lastPeriodStart],
  );

  const daysUntil = useMemo(
    () => getDaysUntilNextPeriod(settings.lastPeriodStart, settings.cycleLength),
    [settings.lastPeriodStart, settings.cycleLength],
  );

  const nextPeriodDate = useMemo(
    () => calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength),
    [settings.lastPeriodStart, settings.cycleLength],
  );

  const phase = useMemo(
    () => getCurrentPhase(cycleDay, settings.cycleLength, settings.periodDuration),
    [cycleDay, settings.cycleLength, settings.periodDuration],
  );

  const daysUntilLabel = daysUntil <= 0 ? 'Today' : `In ${daysUntil} days`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 120,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cycle Ring Hero */}
        <View style={{ marginTop: 16, marginBottom: 32 }}>
          <CycleRing
            cycleDay={cycleDay}
            cycleLength={settings.cycleLength}
            periodDuration={settings.periodDuration}
            phase={phase}
          />
        </View>

        {/* Stat Pills */}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <StatPill
            label="Next period"
            value={daysUntilLabel}
            colors={colors}
          />
          <StatPill
            label="Expected on"
            value={formatShort(toISODate(nextPeriodDate))}
            colors={colors}
          />
        </View>

        {/* Log Today CTA */}
        <TouchableOpacity
          onPress={() => router.push(`/log/${toISODate(new Date())}`)}
          activeOpacity={0.85}
          style={{
            marginTop: 24,
            width: '100%',
            backgroundColor: colors.brand,
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
            boxShadow: `0 6px 20px ${withOpacity(colors.brand, 0.4)}`,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>
            + Log Today
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderCurve: 'continuous',
        padding: 16,
        gap: 4,
        boxShadow: `0 2px 8px ${withOpacity(colors.border, 0.5)}`,
      }}
    >
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 20, color: colors.textPrimary, fontWeight: '800' }} selectable>
        {value}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Visual check in Expo Go**

Verify cycle ring renders, phase label shows, stat pills display formatted dates, Log Today button works.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/home.tsx
git commit -m "feat: redesign home screen with cycle ring hero and stat pills"
```

---

## Task 10: Create CalendarView component

**Files:**
- Create: `src/components/CalendarView.tsx`

- [ ] **Step 1: Create `src/components/CalendarView.tsx`**

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, withOpacity } from '../theme';
import { toISODate, formatMonthYear } from '../utils/date';

export type DayMark = {
  type: 'period' | 'predicted' | 'ovulation' | 'fertile' | 'none';
  hasLog?: boolean;
};

export type MarkedDates = Record<string, DayMark>;

interface CalendarViewProps {
  markedDates: MarkedDates;
  onDayPress: (dateStr: string) => void;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarCells(year: number, month: number): Array<string | null> {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    );
  }
  return cells;
}

export function CalendarView({ markedDates, onDayPress }: CalendarViewProps) {
  const { colors } = useTheme();
  const today = toISODate(new Date());
  const todayDate = new Date();

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());

  const cells = getCalendarCells(viewYear, viewMonth);
  const headerDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Pressable onPress={prevMonth} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.brand} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
          {formatMonthYear(headerDateStr)}
        </Text>
        <Pressable onPress={nextMonth} style={{ padding: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.brand} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {WEEK_DAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <View key={`empty-${idx}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          }
          const mark = markedDates[dateStr];
          const isToday = dateStr === today;
          const cellBg = getCellBg(mark, colors);
          const textColor = cellBg ? '#FFF' : colors.textPrimary;

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onDayPress(dateStr)}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                padding: 3,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  borderCurve: 'continuous',
                  backgroundColor: cellBg ?? 'transparent',
                  borderWidth: isToday && !cellBg ? 1.5 : 0,
                  borderColor: colors.brand,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: isToday ? '700' : '400', color: cellBg ? '#FFF' : (isToday ? colors.brand : colors.textPrimary) }}>
                  {parseInt(dateStr.split('-')[2], 10)}
                </Text>
                {mark?.hasLog && (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: cellBg ? '#FFF' : colors.brand, marginTop: 2 }} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingHorizontal: 4 }}>
        <LegendItem color={colors.period} label="Period" />
        <LegendItem color={withOpacity(colors.period, 0.45)} label="Predicted" />
        <LegendItem color={colors.ovulation} label="Ovulation" />
        <LegendItem color={withOpacity(colors.fertile, 0.55)} label="Fertile" />
      </View>
    </View>
  );
}

function getCellBg(mark: DayMark | undefined, colors: ReturnType<typeof useTheme>['colors']): string | undefined {
  if (!mark) return undefined;
  switch (mark.type) {
    case 'period':    return colors.period;
    case 'predicted': return withOpacity(colors.period, 0.45);
    case 'ovulation': return colors.ovulation;
    case 'fertile':   return withOpacity(colors.fertile, 0.45);
    default:          return undefined;
  }
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "feat: add custom CalendarView component"
```

---

## Task 11: Redesign Calendar screen

**Files:**
- Modify: `app/(tabs)/calendar.tsx`

- [ ] **Step 1: Replace `app/(tabs)/calendar.tsx`**

```typescript
import { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  calculateOvulation,
  getFertileWindow,
} from '../../src/utils/prediction';
import { toISODate, addDays, fromISODate } from '../../src/utils/date';
import { useTheme } from '../../src/theme';
import { CalendarView, type MarkedDates } from '../../src/components/CalendarView';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const cycles = useAppStore((s) => s.cycles);
  const logs = useAppStore((s) => s.logs);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};

    // Logged period days
    cycles.forEach((cycle) => {
      let d = fromISODate(cycle.startDate);
      const end = fromISODate(cycle.endDate);
      while (d <= end) {
        marks[toISODate(d)] = { type: 'period' };
        d = addDays(d, 1);
      }
    });

    // Predicted period
    const nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength);
    for (let i = 0; i < settings.periodDuration; i++) {
      const key = toISODate(addDays(nextPeriod, i));
      if (!marks[key]) marks[key] = { type: 'predicted' };
    }

    // Fertile window
    const ovulation = calculateOvulation(nextPeriod);
    const fertile = getFertileWindow(ovulation);
    let fd = fertile.start;
    while (fd <= fertile.end) {
      const key = toISODate(fd);
      if (!marks[key]) marks[key] = { type: 'fertile' };
      fd = addDays(fd, 1);
    }

    // Ovulation (overwrites fertile if same day)
    const ovKey = toISODate(ovulation);
    if (!marks[ovKey] || marks[ovKey].type === 'fertile') {
      marks[ovKey] = { type: 'ovulation' };
    }

    // Log dots
    logs.forEach((log) => {
      if (marks[log.date]) {
        marks[log.date] = { ...marks[log.date], hasLog: true };
      } else {
        marks[log.date] = { type: 'none', hasLog: true };
      }
    });

    return marks;
  }, [settings, cycles, logs]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CalendarView
        markedDates={markedDates}
        onDayPress={(dateStr) => router.push(`/log/${dateStr}`)}
      />
    </View>
  );
}
```

- [ ] **Step 2: Visual check in Expo Go**

Navigate to Calendar tab. Month grid renders with phase colors. Tapping a day opens the log screen.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/calendar.tsx
git commit -m "feat: redesign calendar screen using custom CalendarView"
```

---

## Task 12: Redesign Log screen

**Files:**
- Modify: `app/log/[date].tsx`

- [ ] **Step 1: Replace `app/log/[date].tsx`**

```typescript
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
  { label: 'Happy',    emoji: '😊' },
  { label: 'Calm',     emoji: '😌' },
  { label: 'Sad',      emoji: '😢' },
  { label: 'Anxious',  emoji: '😰' },
  { label: 'Irritable',emoji: '😤' },
];

const SYMPTOMS: { label: string; emoji: string }[] = [
  { label: 'Cramps',   emoji: '🌊' },
  { label: 'Headache', emoji: '🤕' },
  { label: 'Fatigue',  emoji: '😴' },
  { label: 'Acne',     emoji: '✨' },
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

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

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
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 24 }} selectable>
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
            const fillWidth = `${((index + 1) / 3) * 100}%`;
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
                  borderCurve: 'continuous',
                  backgroundColor: active ? withOpacity(colors.brand, 0.1) : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.brand : colors.border,
                }}
              >
                <Text style={{ width: 52, fontSize: 13, fontWeight: '600', color: active ? colors.brand : colors.textSecondary }}>
                  {label}
                </Text>
                <View style={{ flex: 1, height: 6, backgroundColor: withOpacity(colors.border, 0.5), borderRadius: 3 }}>
                  <View style={{ width: fillWidth, height: '100%', borderRadius: 3, backgroundColor: active ? colors.brand : withOpacity(colors.textSecondary, 0.35) }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      {/* Symptoms */}
      <Section label="Symptoms" colors={colors}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SYMPTOMS.map(({ label, emoji }) => (
            <EmojiChip
              key={label}
              label={label}
              emoji={emoji}
              active={symptoms.includes(label.toLowerCase())}
              onPress={() => toggleSymptom(label.toLowerCase())}
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
            borderCurve: 'continuous',
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
          boxShadow: `0 6px 20px ${withOpacity(colors.brand, 0.35)}`,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Save</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity onPress={handleDelete} style={{ alignItems: 'center', marginTop: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#E57373', fontSize: 13 }}>Delete Entry</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Section({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors'] }) {
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
```

- [ ] **Step 2: Visual check in Expo Go**

Open a log by tapping a day. Header shows "Tuesday, April 17" style. Emoji chips and flow bar render. Save/delete work.

- [ ] **Step 3: Commit**

```bash
git add app/log/[date].tsx
git commit -m "feat: redesign log screen with emoji chips, flow bar, and formatted header"
```

---

## Task 13: Redesign Settings screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Replace `app/(tabs)/settings.tsx`**

```typescript
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
    borderCurve: 'continuous' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  };

  const labelStyle = { fontSize: 13, color: colors.textSecondary, fontWeight: '600' as const, marginBottom: 8 };

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

      {/* Cycle settings */}
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
          boxShadow: `0 6px 20px ${withOpacity(colors.brand, 0.35)}`,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Save Changes</Text>
      </TouchableOpacity>

      <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 24 }} />

      <TouchableOpacity onPress={handleReset} style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text style={{ color: '#E57373', fontSize: 14, fontWeight: '500' }}>Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionHeader({ label, colors }: { label: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 12 }}>
      {label.toUpperCase()}
    </Text>
  );
}
```

- [ ] **Step 2: Visual check in Expo Go**

Navigate to Settings. Theme toggle switches between Light/System/Dark. Tapping Dark switches the whole app to dark mode immediately.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat: redesign settings screen with appearance theme toggle"
```

---

## Task 14: Redesign Onboarding screen

**Files:**
- Modify: `app/onboarding.tsx`

- [ ] **Step 1: Replace `app/onboarding.tsx`**

```typescript
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { toISODate, formatFull } from '../src/utils/date';
import { useTheme, withOpacity } from '../src/theme';

export default function Onboarding() {
  const { colors } = useTheme();
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodDuration, setPeriodDuration] = useState('5');
  const [lastPeriodStart, setLastPeriodStart] = useState(toISODate(new Date()));
  const [showPicker, setShowPicker] = useState(false);

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

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: 'continuous' as const,
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 28, justifyContent: 'center' }}>
        <Text style={{ fontSize: 38, fontWeight: '800', color: colors.brand, marginBottom: 6 }}>
          Welcome
        </Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 40 }}>
          Let's personalise your tracker
        </Text>

        <Text style={labelStyle}>Average cycle length (days)</Text>
        <TextInput
          style={{ ...inputStyle, marginBottom: 20 }}
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="number-pad"
          placeholder="28"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={labelStyle}>Period duration (days)</Text>
        <TextInput
          style={{ ...inputStyle, marginBottom: 20 }}
          value={periodDuration}
          onChangeText={setPeriodDuration}
          keyboardType="number-pad"
          placeholder="5"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={labelStyle}>Last period start date</Text>
        <TouchableOpacity
          style={{ ...inputStyle, marginBottom: 8, justifyContent: 'center' }}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ fontSize: 16, color: colors.textPrimary }}>
            {formatFull(lastPeriodStart)}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={new Date(lastPeriodStart)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(_event, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) setLastPeriodStart(toISODate(date));
            }}
          />
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.brand,
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
            marginTop: 32,
            boxShadow: `0 6px 20px ${withOpacity(colors.brand, 0.35)}`,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={{ alignItems: 'center', marginTop: 16, paddingVertical: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Skip — use defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Visual check in Expo Go**

Reset the app (or clear AsyncStorage) to trigger onboarding. Verify theme applied, date shows as "April 17, 2026" not an ISO string.

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: all tests pass.

- [ ] **Step 4: Final commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: apply theme tokens and fix date display on onboarding screen"
```

---

## Self-Review

**Spec coverage check:**
- [x] Dual light/dark theme system — Task 2
- [x] System preference + manual override — Task 2 (ThemeProvider reads useColorScheme + AsyncStorage)
- [x] Floating pill tab bar — Tasks 7, 8
- [x] Cycle ring hero on Home — Tasks 6, 9
- [x] Custom calendar component — Tasks 10, 11
- [x] Date formatters (formatShort, formatFull, formatHeader, formatMonthYear) — Task 3
- [x] No raw Date.toString() or ISO strings shown to users — Tasks 3, 12, 14
- [x] Appearance / theme toggle in Settings — Task 13
- [x] NativeWind removal — Task 1
- [x] Log screen emoji chips + flow bar — Task 12
- [x] getCurrentPhase for cycle ring label — Tasks 4, 9

**Type consistency:**
- `withOpacity` defined in `src/theme/index.ts`, imported in Tasks 6, 7, 9, 12, 13, 14 ✓
- `useTheme()` returns `{ colors, scheme, preference, setPreference }` — used consistently ✓
- `MarkedDates` exported from `CalendarView.tsx`, imported in `calendar.tsx` ✓
- `getCurrentPhase` exported from `prediction.ts`, imported in `home.tsx` ✓
- `formatShort`, `formatFull`, `formatHeader`, `formatMonthYear` exported from `date.ts` ✓
