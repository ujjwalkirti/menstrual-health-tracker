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
