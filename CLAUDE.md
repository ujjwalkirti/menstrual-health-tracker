# Menstrual Health Tracker — Claude Instructions

## Project Overview
Offline-first menstrual health tracking app. React Native + Expo SDK 54, TypeScript, Zustand, AsyncStorage, Expo Router, NativeWind removed (inline styles with theme tokens).

## Skills to Invoke

Always invoke relevant skills BEFORE starting work. Do not skip them.

### UI / Design Work
- `expo:building-native-ui` — any time building or modifying UI components or screens
- `frontend-design:frontend-design` — any visual/design decisions, new screens, redesigns

### React Native
- `react-native-best-practices` — performance-sensitive changes, animations, lists
- `react-native-architecture` — structural/architectural decisions

### Feature Development Workflow (always follow this order)
1. `superpowers:brainstorming` — before any new feature or significant change
2. `superpowers:writing-plans` — after brainstorming, before writing code
3. `superpowers:using-git-worktrees` — before starting implementation
4. `superpowers:executing-plans` — during implementation
5. `superpowers:requesting-code-review` — after completing a feature

### Debugging
- `superpowers:systematic-debugging` — before proposing any bug fix

## Key Guidelines (from expo:building-native-ui)
- Use `boxShadow` CSS string — never legacy `shadowColor/shadowOpacity/elevation`
- Use `contentInsetAdjustmentBehavior="automatic"` on ScrollViews
- `borderCurve: 'continuous'` on all rounded corners
- ScrollView should be first child inside Stack routes
- Never use `SafeAreaView` — use `react-native-safe-area-context` or ScrollView inset behavior

## Theme System
- All colors via `useTheme()` from `src/theme/index.tsx`
- Never hardcode colors — always use theme tokens
- `withOpacity(hex, opacity)` for transparent variants
- Theme preference stored at `@theme_preference` in AsyncStorage

## Docs & Plans
- Specs: `docs/superpowers/specs/`
- Plans: `docs/superpowers/plans/`
