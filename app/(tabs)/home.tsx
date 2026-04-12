import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import {
  calculateNextPeriod,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
} from '../../src/utils/prediction';
import { toISODate, formatDisplay } from '../../src/utils/date';

export default function Home() {
  const settings = useAppStore((s) => s.settings);

  const cycleDay = useMemo(
    () => getCurrentCycleDay(settings.lastPeriodStart),
    [settings.lastPeriodStart]
  );

  const daysUntil = useMemo(
    () => getDaysUntilNextPeriod(settings.lastPeriodStart, settings.cycleLength),
    [settings.lastPeriodStart, settings.cycleLength]
  );

  const nextPeriodDate = useMemo(
    () => calculateNextPeriod(settings.lastPeriodStart, settings.cycleLength),
    [settings.lastPeriodStart, settings.cycleLength]
  );

  const daysUntilLabel = daysUntil <= 0 ? 'Today' : String(daysUntil);

  return (
    <View className="flex-1 bg-pink-bg">
      <ScrollView
        contentContainerClassName="p-6 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-extrabold text-pink-brand mb-7">Your cycle</Text>

        <View
          className="bg-white rounded-2xl p-6 mb-4"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
        >
          <Text className="text-xs text-gray-400 font-medium mb-1">Current cycle day</Text>
          <Text className="text-4xl font-extrabold text-gray-800">{cycleDay}</Text>
        </View>

        <View
          className="bg-white rounded-2xl p-6 mb-4"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
        >
          <Text className="text-xs text-gray-400 font-medium mb-1">Days until next period</Text>
          <Text className="text-4xl font-extrabold text-gray-800">{daysUntilLabel}</Text>
        </View>

        <View
          className="bg-white rounded-2xl p-6 mb-4"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
        >
          <Text className="text-xs text-gray-400 font-medium mb-1">Next period expected</Text>
          <Text className="text-4xl font-extrabold text-gray-800">
            {formatDisplay(toISODate(nextPeriodDate))}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-8 right-6 bg-pink-brand rounded-full px-7 py-4"
        style={{ shadowColor: '#E91E8C', shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 }}
        onPress={() => router.push(`/log/${toISODate(new Date())}`)}
        activeOpacity={0.85}
      >
        <Text className="text-white font-extrabold text-base">+ Log Today</Text>
      </TouchableOpacity>
    </View>
  );
}
