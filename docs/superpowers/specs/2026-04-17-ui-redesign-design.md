# UI Redesign — Menstrual Health Tracker

**Date:** 2026-04-17  
**Status:** Approved

---

## Overview

A full visual redesign of the app across all screens. The goals are:

- Introduce a dual-theme system (soft/organic light + deep/intimate dark) with system preference auto-detection and a manual override in Settings
- Replace the plain white-cards-on-pink layout with a distinctive, premium feel
- Replace the standard tab bar with a custom floating pill tab bar
- Replace `react-native-calendars` with a fully custom calendar component
- Add a cycle ring hero element to the Home screen
- Fix date formatting throughout the app (no raw ISO strings or `Date.toString()` output ever shown to users)
- Drop NativeWind — all styling moves to inline styles using theme tokens

---

## 1. Theme System

**Location:** `src/theme/index.ts`

Exports:
- `ThemeProvider` — wraps the app, reads `useColorScheme` for system preference, reads `@theme_preference` from AsyncStorage for manual override
- `useTheme()` — returns the active color palette

**Manual override values:** `'light' | 'dark' | 'system'`  
**AsyncStorage key:** `@theme_preference`

### Light Palette (Soft & Organic)

| Token | Value | Use |
|---|---|---|
| `background` | `#FFF8F5` | Screen backgrounds |
| `surface` | `#FFFFFF` | Cards, inputs |
| `brand` | `#D64F7A` | Primary actions, ring fill, active tab |
| `accent` | `#FF8FA3` | Highlights |
| `period` | `#E8547A` | Logged period days |
| `fertile` | `#7BC67E` | Fertile window days |
| `ovulation` | `#FFB347` | Ovulation day |
| `textPrimary` | `#1A1A2E` | Headings, body text |
| `textSecondary` | `#9B8A9B` | Labels, captions |
| `border` | `#F0DDE8` | Input borders, dividers |

### Dark Palette (Deep & Intimate)

| Token | Value | Use |
|---|---|---|
| `background` | `#0D0B14` | Screen backgrounds |
| `surface` | `#1A1625` | Cards, inputs |
| `brand` | `#E8547A` | Primary actions, ring fill, active tab |
| `accent` | `#C084A0` | Highlights |
| `period` | `#E8547A` | Logged period days |
| `fertile` | `#4CAF7D` | Fertile window days |
| `ovulation` | `#F0A843` | Ovulation day |
| `textPrimary` | `#F5E6FF` | Headings, body text |
| `textSecondary` | `#8B7DA8` | Labels, captions |
| `border` | `#2D2540` | Input borders, dividers |

---

## 2. Date Formatting

**Location:** `src/utils/date.ts` — replaces the single `formatDisplay()` with purpose-built formatters.

| Function | Output example | Used in |
|---|---|---|
| `formatShort(dateStr)` | `"Apr 17"` | Home screen stat pills |
| `formatFull(dateStr)` | `"April 17, 2026"` | Settings, Onboarding |
| `formatHeader(dateStr)` | `"Tuesday, April 17"` | Log screen header |
| `formatMonthYear(dateStr)` | `"April 2026"` | Calendar header |

No raw `Date.toString()`, no raw ISO date strings, no timezone output shown to users anywhere in the app.

---

## 3. Home Screen (`app/(tabs)/home.tsx`)

**Hero: Cycle Ring**
- SVG-based circular progress ring using `react-native-svg`
- Ring track is split into colored arcs representing cycle phases (period, fertile, ovulation zones)
- Ring fills clockwise based on `currentCycleDay / cycleLength`
- Center: large cycle day number + current phase label ("Period", "Fertile Window", "Ovulation", "Luteal")

**Below ring — two stat pills (horizontal row):**
- "In X days" — days until next period
- Next period date — formatted with `formatShort()`

**CTA:**
- Full-width "Log Today" button, `brand` color, anchored above the floating tab bar

---

## 4. Custom Floating Tab Bar (`src/components/FloatingTabBar.tsx`)

- Pill-shaped container, ~70% screen width, horizontally centered
- Positioned `absolute` at bottom, respects safe area inset
- Background: `surface` color at 90% opacity with `boxShadow` for elevation
- Dark theme: subtle `brand`-colored glow shadow
- Active tab: filled pill/blob slides behind active icon (animated with Reanimated)
- Active icon color: `brand`; inactive: `textSecondary`
- Wired via `tabBar` prop on the `<Tabs>` component in `app/(tabs)/_layout.tsx`
- Icons: Ionicons (existing dependency, works cross-platform)

---

## 5. Custom Calendar Component (`src/components/CalendarView.tsx`)

Replaces `react-native-calendars`. No new dependencies — uses `View`, `Text`, `TouchableOpacity`, and existing date utils.

**Header:** `formatMonthYear()` centered, left/right chevron arrows to navigate months.

**Day grid:** 7-column grid, Sun–Sat header row.

**Day cell states:**

| State | Appearance |
|---|---|
| Logged period day | Filled `period` color, white text |
| Predicted period day | `period` at 40% opacity |
| Ovulation day | Filled `ovulation` color, white text |
| Fertile window day | `fertile` at 40% opacity |
| Has log entry | Small dot below the day number |
| Today | `brand` color border ring |
| Other month day | Dimmed `textSecondary`, not tappable |
| Normal day | `surface` background, `textPrimary` text |

**Legend row:** below calendar, colored dot + label per phase.

**Tap behavior:** navigates to `log/[date]` as before.

---

## 6. Log Screen (`app/log/[date].tsx`)

**Header:** `formatHeader(date)` — "Tuesday, April 17"

**Mood chips:** emoji + label  
- 😊 Happy · 😌 Calm · 😢 Sad · 😰 Anxious · 😤 Irritable

**Flow selector:** 3-segment visual intensity bar replacing text chips  
- One tap selects level; bar fills proportionally to indicate light / medium / heavy

**Symptoms chips:** icon + label  
- 🌊 Cramps · 🤕 Headache · 😴 Fatigue · ✨ Acne

**Notes:** restyled textarea, same behavior.

**Save button:** full-width, `brand` color, above keyboard.

---

## 7. Settings Screen (`app/(tabs)/settings.tsx`)

**Appearance section (new):**
- 3-way segmented control: `Light | System | Dark`
- Persists to `@theme_preference` in AsyncStorage
- Updates `ThemeProvider` immediately

**Cycle Settings section:** cycle length + period duration inputs, restyled.

**Danger Zone:** Reset all data — same destructive Alert behavior.

---

## 8. Onboarding Screen (`app/onboarding.tsx`)

Minimal changes:
- Apply new theme tokens
- Replace raw date display with `formatFull()`
- Keep existing flow and structure unchanged

---

## Files to Create

| File | Purpose |
|---|---|
| `src/theme/index.ts` | Theme provider, `useTheme()` hook, both palettes |
| `src/components/FloatingTabBar.tsx` | Custom pill tab bar |
| `src/components/CalendarView.tsx` | Custom calendar grid |
| `src/components/CycleRing.tsx` | SVG cycle progress ring |

## Files to Modify

| File | Changes |
|---|---|
| `src/utils/date.ts` | Add `formatShort`, `formatFull`, `formatHeader`, `formatMonthYear`; remove `formatDisplay` |
| `app/_layout.tsx` | Wrap app in `ThemeProvider` |
| `app/(tabs)/_layout.tsx` | Wire `FloatingTabBar` via `tabBar` prop; remove NativeWind tab styles |
| `app/(tabs)/home.tsx` | New layout with `CycleRing`, stat pills, CTA button |
| `app/(tabs)/calendar.tsx` | Replace `react-native-calendars` with `CalendarView` |
| `app/(tabs)/settings.tsx` | Add Appearance section with theme toggle |
| `app/log/[date].tsx` | New header, emoji chips, flow bar, restyled |
| `app/onboarding.tsx` | Apply theme tokens, fix date display |
| `package.json` | Add `react-native-svg`; remove `react-native-calendars`, `nativewind`, `tailwindcss` |

## Dependencies

| Action | Package |
|---|---|
| Add | `react-native-svg` (for `CycleRing`) |
| Remove | `react-native-calendars` |
| Remove | `nativewind`, `tailwindcss` |

---

## Out of Scope

- No new screens
- No changes to data models, Zustand store, or prediction logic
- No animations beyond the tab bar active indicator and ring fill
- No cycle-adding / period-editing UI (existing flow unchanged)
