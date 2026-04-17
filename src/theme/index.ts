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
