# Menstrual Health Tracker App (React Native - Local Only)

## Overview
Build a simple, private, offline-first menstrual health tracking mobile application using React Native. 

This app is strictly local-only:
- No backend
- No authentication
- No cloud sync

All data must be stored on the device using local storage.

The focus is:
- Simplicity
- Privacy
- Fast performance
- Clean UX

---

## Tech Stack
- React Native (Expo preferred)
- TypeScript
- State Management: Zustand (preferred for simplicity)
- Storage: AsyncStorage (primary) or SQLite (optional)

---

## Core Principles
- Offline-first (app must fully work without internet)
- Minimal setup (no login/signup)
- Fast interactions (no heavy computations)
- Deterministic predictions (no ML)

---

## Core Features

### 1. Onboarding (One-Time Setup)
- Simple screen on first launch
- Inputs:
  - Average cycle length (default: 28)
  - Period duration (default: 5)
  - Last period start date
- Store in local storage
- Allow skipping (use defaults)

---

### 2. Home Screen (Dashboard)
Display:
- Current cycle day
- Days until next period
- Next predicted period date
- Quick "Log Today" button

---

### 3. Calendar View
- Monthly calendar UI
- Highlight:
  - Logged period days
  - Predicted period days
  - Ovulation day
  - Fertile window
- Tap a date → open log details / add log

---

### 4. Period Tracking
- Add/edit:
  - Period start date
  - Period end date
- Auto-calculate:
  - Cycle length
- Store cycles locally

---

### 5. Daily Logs
Users can log per day:
- Mood (string or enum)
- Symptoms (multi-select):
  - cramps
  - headache
  - fatigue
  - acne
- Flow:
  - light | medium | heavy
- Notes (text)

---

### 6. Prediction Logic (Simple Algorithm)
Use deterministic calculations:
- Next period = last period start + cycle length
- Ovulation ≈ next period - 14 days
- Fertile window = ovulation ± 2 days

No external APIs or ML.

---

### 7. Notifications (Local Only - Optional)
- Local notifications (Expo Notifications)
- Reminders:
  - Upcoming period (1–2 days before)
  - Daily logging reminder

---

### 8. Settings
- Update:
  - Cycle length
  - Period duration
- Reset all data (clear storage)
- Toggle notifications

---

## Storage Design (AsyncStorage)

### Keys
@settings  
@cycles  
@logs  

---

## Data Models

### Settings
type Settings = {
  cycleLength: number;
  periodDuration: number;
  lastPeriodStart: string;
  hasOnboarded: boolean;
};

---

### Cycle
type Cycle = {
  id: string;
  startDate: string;
  endDate: string;
};

---

### Daily Log
type DailyLog = {
  id: string;
  date: string;
  mood?: string;
  symptoms?: string[];
  flow?: 'light' | 'medium' | 'heavy';
  notes?: string;
};

---

## State Management (Zustand)

Create a global store:
- settings
- cycles
- logs

Actions:
- addCycle
- updateCycle
- addLog
- updateLog
- deleteLog
- loadFromStorage
- persistToStorage

---

## App Flow

1. App Launch
   - Check hasOnboarded
   - If false → show onboarding
   - Else → go to Home

2. Home Screen
   - Show predictions + quick actions

3. Calendar Screen
   - View + select dates

4. Log Screen
   - Add/edit daily logs

5. Settings Screen

---

## UI/UX Requirements
- Minimal and soft design (pastel tones)
- Smooth transitions
- Clear visual indicators for:
  - Period days
  - Fertile window
- Easy one-hand usage
- Floating Action Button (FAB) for quick logging

---

## Folder Structure
/src
  /components
  /screens
  /store
  /utils
    prediction.ts
    date.ts
  /models
  /storage

---

## Utility Modules

### prediction.ts
- calculateNextPeriod()
- calculateOvulation()
- getFertileWindow()

### storage.ts
- getItem()
- setItem()
- removeItem()

---

## Edge Cases
- Missing past data → fallback to defaults
- Irregular cycles → still use average cycle length
- Editing past cycles → recompute predictions

---

## Performance Considerations
- Avoid re-rendering full calendar unnecessarily
- Memoize computed predictions
- Batch AsyncStorage operations

---

## Deliverables
- Fully working React Native app
- Local-only data persistence
- Clean modular code
- README with setup steps

---

## Goal
Build a private, lightweight, and thoughtful menstrual tracker that works entirely offline and feels personal to the user.
