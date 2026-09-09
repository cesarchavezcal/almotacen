import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { colors, spacing, radius } from '@/src/theme';
import { Button } from '@/src/components/Button';

export default function CashFlowScreen() {
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
        <View style={[styles.statCard, { marginRight: spacing.sm }]}>
          <Text style={styles.statLabel}>Total Inflow</Text>
          <Text style={[styles.statValue, { color: colors.inflow }]}>+$4,850.00</Text>
          <Text style={styles.statSub}>Paycheck & Transfers</Text>
        </View>

        <View style={[styles.statCard, { marginLeft: spacing.sm }]}>
          <Text style={styles.statLabel}>Total Outflow</Text>
          <Text style={[styles.statValue, { color: colors.outflow }]}>-$3,424.50</Text>
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
        <Button
          title="+ Log Quick Expense"
          variant="primary"
          size="lg"
          style={styles.actionButton}
        />
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md + 4,
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.tertiaryLabel,
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
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: radius.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    color: colors.secondaryLabel,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  statSub: {
    fontSize: 11,
    color: colors.tertiaryLabel,
    marginTop: spacing.xs,
  },
  sectionCard: {
    padding: spacing.md + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm + 4,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  actionButton: {
    marginTop: spacing.xs,
  },
});
