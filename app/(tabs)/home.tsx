import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Your cycle</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current cycle day</Text>
          <Text style={styles.cardValue}>{cycleDay}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Days until next period</Text>
          <Text style={styles.cardValue}>{daysUntilLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Next period expected</Text>
          <Text style={styles.cardValue}>{formatDisplay(toISODate(nextPeriodDate))}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/log/${toISODate(new Date())}`)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Log Today</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  scroll: { padding: 24, paddingBottom: 100 },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#E91E8C',
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#E91E8C',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: { fontSize: 13, color: '#AAA', marginBottom: 6, fontWeight: '500' },
  cardValue: { fontSize: 30, fontWeight: '800', color: '#2D2D2D' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#E91E8C',
    borderRadius: 36,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowColor: '#E91E8C',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  fabText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
