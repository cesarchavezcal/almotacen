import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function CashFlowScreen() {
  const colorScheme = useColorScheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Monthly Net Summary */}
      <View style={styles.heroCard}>
        <Text style={styles.heroSubtitle}>September Cash Flow</Text>
        <Text style={styles.heroAmount}>+$1,425.50</Text>
        <Text style={styles.heroStatus}>On track &bull; Burn rate: 42% of budget</Text>
      </View>

      {/* Reactive Flow KPI Split */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { marginRight: 10 }]}>
          <Text style={styles.statLabel}>Total Inflow</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>+$4,850.00</Text>
          <Text style={styles.statSub}>Paycheck & Transfers</Text>
        </View>

        <View style={[styles.statCard, { marginLeft: 10 }]}>
          <Text style={styles.statLabel}>Total Outflow</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>-$3,424.50</Text>
          <Text style={styles.statSub}>Spent this cycle</Text>
        </View>
      </View>

      {/* Burn Velocity Indicator */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Month Trajectory</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: '42%' }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>Spent: $3,424.50</Text>
          <Text style={styles.progressText}>Remaining: $1,425.50</Text>
        </View>
      </View>

      {/* Quick Action Button */}
      <Link href="/modal" asChild>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>+ Log Quick Expense</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  heroStatus: {
    fontSize: 14,
    color: '#34D399',
    marginTop: 8,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
