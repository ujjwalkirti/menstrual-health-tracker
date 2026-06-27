# Notifications & Reminders — Design Spec

**Date:** 2026-05-02  
**Status:** Approved

---

## Overview

Add local push notifications to remind users of upcoming period, fertile window start, and ovulation day. All notifications are scheduled locally using `expo-notifications` — no backend required, consistent with the app's offline-first architecture.

---

## Notification Types

| Type | Trigger | Default | User-configurable |
|------|---------|---------|-------------------|
| Period reminder | N days before predicted period, 9am | Enabled, 2 days lead | Toggle + lead days (1–7) |
| Fertile window start | First day of fertile window, 9am | Enabled | Toggle |
| Ovulation day | Predicted ovulation day, 9am | Enabled | Toggle |

---

## Data Model

Add four fields to the existing `Settings` type in `src/models/types.ts`:

```ts
notificationsPeriodEnabled: boolean      // default: true
notificationsPeriodLeadDays: number      // default: 2, range: 1–7
notificationsFertileEnabled: boolean     // default: true
notificationsOvulationEnabled: boolean   // default: true
```

Update the Zustand store default state and `updateSettings` action to include these fields. AsyncStorage persistence is handled automatically by the existing storage layer.

---

## Scheduling Logic

### `src/utils/notifications.ts` (new file)

Single exported function:

```ts
scheduleNotifications(settings: Settings): Promise<void>
```

Steps:
1. Cancel all previously scheduled notifications (`cancelAllScheduledNotificationsAsync`).
2. If the relevant toggle is off, skip that notification type.
3. Request notification permissions if not already granted. If denied, return early without scheduling.
4. Compute target dates using existing prediction utilities:
   - `nextPeriod = calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength)`
   - Period trigger: `nextPeriod - notificationsPeriodLeadDays days`
   - `ovulation = calculateOvulation(nextPeriod)`
   - Fertile window trigger: `getFertileWindow(ovulation).start`
   - Ovulation trigger: `ovulation`
5. For each enabled type, if the target date is in the future, schedule a local notification at 9:00am on that date.

### When to call `scheduleNotifications`

- On app launch (in the root layout, after store hydration).
- Whenever `settings` changes in the Zustand store (watch `cycleLength`, `lastPeriodStart`, `periodDuration`, and all four notification fields).

---

## Permissions

On first call to `scheduleNotifications` when any notification is enabled:
- Request permission via `Notifications.requestPermissionsAsync()`.
- If denied: show an inline alert in the Settings screen guiding the user to enable notifications in system settings (`Linking.openSettings()`).
- Permission state is not stored — re-check on each `scheduleNotifications` call.

---

## Settings Screen Changes

Replace the existing single notifications toggle with a dedicated **Notifications** sub-section:

```
Notifications
─────────────────────────────────────────
Period Reminder          [toggle]
  Remind me N days before              [1–7 stepper, shown when toggle is on]

Fertile Window Alert     [toggle]

Ovulation Day Alert      [toggle]
```

- The lead-days stepper (−/+ buttons showing current value) is only visible when the period reminder toggle is on.
- All changes call `updateSettings` and trigger a `scheduleNotifications` call.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/models/types.ts` | Add 4 notification fields to `Settings` |
| `src/store/index.ts` | Add defaults for new fields |
| `src/utils/notifications.ts` | New — `scheduleNotifications` utility |
| `app/_layout.tsx` | Call `scheduleNotifications` after hydration |
| `app/(tabs)/settings.tsx` | Replace single toggle with notifications sub-section |

---

## Out of Scope

- Daily logging reminders (separate feature).
- Push notifications via backend.
- Notification history / inbox.
- Snooze or repeat notifications.
