# Menstrual Health Tracker — Design Spec
**Date:** 2026-04-07

---

## Overview

A private, offline-first menstrual health tracking mobile app built with React Native (Expo). No backend, no auth, no cloud sync. All data lives on-device. Target: simplicity, privacy, fast performance, clean UX.

---

## Tech Stack

| Package | Version |
|---|---|
| `expo` | `~51.0.0` |
| `react-native` | `0.74.x` |
| `expo-router` | `~3.5.0` |
| `typescript` | `~5.3.0` |
| `zustand` | `^4.5.x` |
| `@react-native-async-storage/async-storage` | `1.23.x` |
| `react-native-calendars` | `^1.1306.0` |
| `expo-notifications` | `~0.28.0` |
| `expo-splash-screen` | `~0.27.0` |
| `react-native-safe-area-context` | `4.10.x` |
| `react-native-screens` | `~3.31.0` |

All versions are peer-conflict-free under Expo SDK 51. `react-native-safe-area-context` and `react-native-screens` are pinned by Expo's resolver.

---

## Folder Structure

```
app/
  _layout.tsx          # Root layout — splash screen, store hydration
  index.tsx            # Entry redirect: onboarding or (tabs)/home
  onboarding.tsx       # One-time setup screen
  (tabs)/
    _layout.tsx        # Bottom tab bar
    home.tsx           # Dashboard screen
    calendar.tsx       # Monthly calendar view
    settings.tsx       # Settings screen
  log/
    [date].tsx         # Daily log screen (add/edit, keyed by date string)

src/
  components/          # Reusable UI components
  store/
    useAppStore.ts     # Single Zustand store (settings + cycles + logs)
  utils/
    prediction.ts      # Deterministic cycle prediction helpers
    date.ts            # Date formatting/manipulation helpers
    storage.ts         # AsyncStorage read/write wrappers
  models/
    types.ts           # TypeScript types: Settings, Cycle, DailyLog
```

---

## Data Models

```ts
type Settings = {
  cycleLength: number;       // default: 28
  periodDuration: number;    // default: 5
  lastPeriodStart: string;   // ISO date string
  hasOnboarded: boolean;
};

type Cycle = {
  id: string;
  startDate: string;         // ISO date string
  endDate: string;           // ISO date string
};

type DailyLog = {
  id: string;
  date: string;              // ISO date string
  mood?: string;
  symptoms?: string[];       // 'cramps' | 'headache' | 'fatigue' | 'acne'
  flow?: 'light' | 'medium' | 'heavy';
  notes?: string;
};
```

AsyncStorage keys: `@settings`, `@cycles`, `@logs`.

---

## State Management

Single Zustand store (`useAppStore.ts`) holds:
- `settings: Settings`
- `cycles: Cycle[]`
- `logs: DailyLog[]`

Actions:
- `loadFromStorage()` — hydrate all keys on app start
- `persistToStorage()` — called after every mutation
- `addCycle / updateCycle`
- `addLog / updateLog / deleteLog`
- `updateSettings`

Predictions are never stored — they are computed on-the-fly from `settings` and `cycles` using memoized selectors inside `prediction.ts`.

---

## Screens

### Onboarding
- Shown once (`hasOnboarded === false`)
- Fields: cycle length, period duration, last period start date
- Skip allowed (uses defaults)
- On submit: writes `@settings`, sets `hasOnboarded: true`, navigates to home

### Home (Dashboard)
- Current cycle day
- Days until next period
- Next predicted period date
- "Log Today" FAB → navigates to `log/[today]`

### Calendar
- `react-native-calendars` monthly calendar
- Marked dates: logged period days, predicted period days, ovulation day, fertile window (color-coded)
- Tap date → navigate to `log/[date]`

### Daily Log (`log/[date].tsx`)
- Mood input (string/enum)
- Symptoms multi-select: cramps, headache, fatigue, acne
- Flow selector: light / medium / heavy
- Notes text input
- Save / delete log

### Settings
- Edit cycle length and period duration
- Toggle notifications on/off
- Reset all data (clears AsyncStorage, resets store, redirects to onboarding)

---

## Prediction Logic (`prediction.ts`)

```ts
calculateNextPeriod(lastPeriodStart, cycleLength) → Date
calculateOvulation(nextPeriod) → Date         // nextPeriod - 14 days
getFertileWindow(ovulation) → { start, end }  // ovulation ± 2 days
```

Deterministic only. No ML. Edge case: missing `lastPeriodStart` falls back to today's date.

---

## Notifications (Optional, Local Only)

Using `expo-notifications`:
- Reminder 1–2 days before predicted period
- Daily logging reminder
- Scheduled/cancelled in `settings.ts` when user toggles on/off

---

## App Flow

1. App launch → `_layout.tsx` hydrates store from AsyncStorage
2. `index.tsx` checks `hasOnboarded` → routes to `onboarding` or `(tabs)/home`
3. All navigation within tabs; log screen pushed as a stack route
4. Every store mutation immediately persists to AsyncStorage

---

## UI/UX

- Pastel color palette, soft design
- Smooth screen transitions (Expo Router default)
- FAB on home for quick log entry
- Color coding: period days (pink/red), fertile window (green), ovulation (yellow/gold)
- One-hand-friendly layout (actions at bottom)

---

## Performance

- Calendar marked dates computed once per render cycle, memoized
- AsyncStorage operations batched where possible (`multiSet` / `multiGet`)
- No unnecessary re-renders — Zustand slices used selectively per screen

---

## Edge Cases

- Missing `lastPeriodStart` → use today as fallback
- Irregular cycles → use stored average `cycleLength`, no dynamic recalculation
- Editing a past cycle → predictions recomputed from updated data on next render

---

## Out of Scope

- Backend, cloud sync, authentication
- ML-based predictions
- Export/import of data
- Multi-user support
