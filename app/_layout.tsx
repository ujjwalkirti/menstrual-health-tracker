import '../global.css';
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
