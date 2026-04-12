import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { toISODate } from '../src/utils/date';

export default function Onboarding() {
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodDuration, setPeriodDuration] = useState('5');
  const [lastPeriodStart, setLastPeriodStart] = useState(toISODate(new Date()));
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = async () => {
    await updateSettings({
      cycleLength: parseInt(cycleLength, 10) || 28,
      periodDuration: parseInt(periodDuration, 10) || 5,
      lastPeriodStart: lastPeriodStart || toISODate(new Date()),
      hasOnboarded: true,
    });
    router.replace('/(tabs)/home');
  };

  const handleSkip = async () => {
    await updateSettings({ hasOnboarded: true });
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow p-7 bg-pink-bg justify-center">
        <Text className="text-4xl font-extrabold text-pink-brand mb-2">Welcome</Text>
        <Text className="text-base text-gray-400 mb-10">Let's personalise your tracker</Text>

        <View className="mb-6">
          <Text className="text-sm text-gray-500 font-medium mb-2">Average cycle length (days)</Text>
          <TextInput
            className="border border-pink-border rounded-xl px-4 py-3 text-base bg-white text-gray-800"
            value={cycleLength}
            onChangeText={setCycleLength}
            keyboardType="number-pad"
            placeholder="28"
            placeholderTextColor="#CCC"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm text-gray-500 font-medium mb-2">Period duration (days)</Text>
          <TextInput
            className="border border-pink-border rounded-xl px-4 py-3 text-base bg-white text-gray-800"
            value={periodDuration}
            onChangeText={setPeriodDuration}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor="#CCC"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm text-gray-500 font-medium mb-2">Last period start date</Text>
          <TouchableOpacity
            className="border border-pink-border rounded-xl px-4 py-3 bg-white"
            onPress={() => setShowPicker(true)}
          >
            <Text className="text-gray-800 text-base">{lastPeriodStart}</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={new Date(lastPeriodStart)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(_event, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) setLastPeriodStart(toISODate(date));
            }}
          />
        )}

        <TouchableOpacity
          className="bg-pink-brand rounded-2xl py-5 items-center mt-8 shadow-lg"
          style={{ shadowColor: '#E91E8C', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}
          onPress={handleSubmit}
        >
          <Text className="text-white text-lg font-bold">Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center mt-5 py-2" onPress={handleSkip}>
          <Text className="text-gray-300 text-sm">Skip — use defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
