import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';

export default function Index() {
  const hasOnboarded = useAppStore((s) => s.settings.hasOnboarded);
  return <Redirect href={hasOnboarded ? '/(tabs)/home' : '/onboarding'} />;
}
