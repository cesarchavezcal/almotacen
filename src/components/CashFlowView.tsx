import React from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { spacing } from '@/src/theme/spacing';
import { TransactionRow } from './TransactionRow';
import { CashflowTrajectoryChart } from './CashflowTrajectoryChart';
import { MonthPagingHeader } from './MonthPagingHeader';
import {
  formatCentsToCurrency,
  formatSignedCents,
  calculateDailyCashRewardCents,
} from '@/src/domain/ledger/currency';
import { CashflowMetrics, DailyTrajectoryPoint } from '@/src/domain/cashflow/cashflowCalculations';
import { Category, Transaction } from '@/src/domain/ledger/types';

export interface CashFlowViewProps {
  metrics: CashflowMetrics;
  recentOutflows: Transaction[];
  categories: Record<string, Category>;
  monthLabel: string;
  cycleTitle: string;
  isCurrentMonth: boolean;
  currentDay: number;
  totalDaysInMonth: number;
  isScrollLocked: boolean;
  activeScrubDate: string | null;
  onScrubChange: (day: number | null, point: DailyTrajectoryPoint | null) => void;
  onScrollLockChange: (isLocked: boolean) => void;
  onLogPress: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth?: () => void;
}

function formatTransactionDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return isoString;
    }
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `Today, ${timeStr}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    console.warn(`Failed to format transaction date for "${isoString}":`, error);
    return isoString;
  }
}

function getCategoryIcon(categoryName?: string): keyof typeof Ionicons.glyphMap {
  const lower = categoryName?.toLowerCase() || '';
  if (lower.includes('groc') || lower.includes('market') || lower.includes('food')) return 'cart';
  if (lower.includes('elec') || lower.includes('tech') || lower.includes('apple'))
    return 'phone-portrait';
  if (lower.includes('din') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('rest'))
    return 'cafe';
  if (lower.includes('uber') || lower.includes('trans') || lower.includes('gas') || lower.includes('car'))
    return 'car';
  if (lower.includes('rent') || lower.includes('mortgage') || lower.includes('home')) return 'home';
  if (lower.includes('util') || lower.includes('bill')) return 'flash';
  return 'card-outline';
}

export function CashFlowView({
  metrics,
  recentOutflows,
  categories,
  monthLabel,
  cycleTitle,
  isCurrentMonth,
  currentDay,
  totalDaysInMonth,
  isScrollLocked,
  activeScrubDate,
  onScrubChange,
  onScrollLockChange,
  onLogPress,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
}: CashFlowViewProps): React.JSX.Element {
  const heroStatusText =
    metrics.burnStatus === 'EXCEEDS_INCOME'
      ? `Over income • Burn rate: ${metrics.burnRatePercent}% of budget`
      : metrics.burnStatus === 'PACING_HIGH'
        ? `Pacing high • Burn rate: ${metrics.burnRatePercent}% of budget`
        : `On track • Burn rate: ${metrics.burnRatePercent}% of budget`;

  const heroStatusColor =
    metrics.burnStatus === 'EXCEEDS_INCOME'
      ? '#991B1B'
      : metrics.burnStatus === 'PACING_HIGH'
        ? '#92400E'
        : '#166534';

  const remainingBudgetCents = Math.max(
    0,
    metrics.totalBudgetPlannedCents - metrics.totalOutflowCents
  );
  const progressBarWidthPercent = Math.min(100, Math.max(0, metrics.burnRatePercent));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isScrollLocked}
    >
      {/* Month Cycle Paging Header (SCEN-024) */}
      <MonthPagingHeader
        cycleTitle={cycleTitle}
        isCurrentMonth={isCurrentMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onCurrentMonth={onCurrentMonth}
      />

      {/* Apple Card Titanium Hero Card (SCEN-016) */}
      <View style={styles.heroShadow}>
        <View style={styles.heroFrame}>
          <LinearGradient
            colors={[colors.titaniumHi, colors.titaniumMid, colors.titaniumLo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.chip} />
              <Ionicons name="logo-apple" size={24} color="#1A1A1A" />
            </View>

            <View style={styles.heroCenter}>
              <Text style={styles.heroSubtitle}>{monthLabel}</Text>
              <Text style={[typography.balanceHero, styles.heroAmount]}>
                {formatSignedCents(metrics.netCashflowCents)}
              </Text>
              <Text style={[styles.heroStatus, { color: heroStatusColor }]}>
                {heroStatusText}
              </Text>
            </View>

            <View style={styles.heroBottomRow}>
              <Text style={[typography.cardHolder, { color: '#1A1A1A' }]}>
                CESAR CHAVEZ
              </Text>
              <View style={styles.dailyCashChip}>
                <Text style={styles.dailyCashText}>$</Text>
              </View>
            </View>
          </View>
          <View style={styles.innerHighlight} pointerEvents="none" />
        </View>
      </View>

      {/* Reactive Trajectory Curve Chart & Scrubbing Feed (SCEN-017..SCEN-023) */}
      <CashflowTrajectoryChart
        metrics={metrics}
        currentDay={currentDay}
        totalDaysInMonth={totalDaysInMonth}
        onScrubChange={onScrubChange}
        onScrollLockChange={onScrollLockChange}
      />

      {/* Key Inflow / Outflow Quick Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { marginRight: spacing.sm }]}>
          <Text style={styles.statLabel}>TOTAL INFLOW</Text>
          <Text style={[typography.headline, styles.statValue, { color: colors.inflow }]}>
            {formatCentsToCurrency(metrics.totalInflowCents)}
          </Text>
          <Text style={styles.statSub}>Earned this cycle</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL OUTFLOW</Text>
          <Text style={[typography.headline, styles.statValue, { color: colors.outflow }]}>
            {formatCentsToCurrency(metrics.totalOutflowCents)}
          </Text>
          <Text style={styles.statSub}>Spent across envelopes</Text>
        </View>
      </View>

      {/* Budget Burn & Velocity Gauge */}
      <View style={styles.sectionCard}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>PLANNED BUDGET</Text>
            <Text style={[typography.headline, styles.statValue, { color: colors.textPrimary }]}>
              {formatCentsToCurrency(metrics.totalBudgetPlannedCents)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statLabel}>REMAINING</Text>
            <Text
              style={[
                typography.headline,
                styles.statValue,
                { color: remainingBudgetCents > 0 ? colors.inflow : colors.outflow },
              ]}
            >
              {formatCentsToCurrency(remainingBudgetCents)}
            </Text>

          </View>
        </View>

        {/* Minimal Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressBarWidthPercent}%`,
                backgroundColor:
                  metrics.burnStatus === 'EXCEEDS_INCOME'
                    ? colors.error
                    : metrics.burnStatus === 'PACING_HIGH'
                      ? colors.warning
                      : colors.success,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[typography.caption, styles.progressText]}>
            Pacing Target: <Text style={styles.boldText}>{formatCentsToCurrency(metrics.linearPaceToDateCents)}</Text>
          </Text>
          <Text style={[typography.caption, styles.progressText]}>
            EOM Projected: <Text style={styles.boldText}>{formatCentsToCurrency(metrics.projectedEomSpendCents)}</Text>
          </Text>
        </View>
      </View>

      {/* Transactions Section Header */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[typography.headline, { color: colors.textPrimary }]}>
            {activeScrubDate ? `Outflows for ${activeScrubDate}` : 'Recent Outflows'}
          </Text>
        </View>

        <View style={styles.groupedList}>
          {recentOutflows.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[typography.subhead, styles.emptyText]}>
                {activeScrubDate ? 'No transactions on this date' : 'No recent outflows recorded'}
              </Text>
            </View>
          ) : (
            recentOutflows.map((tx, index) => {
              const cat = tx.categoryId ? categories[tx.categoryId] : undefined;
              const catName = cat?.name || 'Unassigned';
              const dailyCashCents = calculateDailyCashRewardCents(tx.amountCents, 200);
              const dailyCashStr =
                dailyCashCents > 0 ? `+${formatCentsToCurrency(dailyCashCents)}` : undefined;

              return (
                <TransactionRow
                  key={tx.id}
                  merchant={tx.payee}
                  date={formatTransactionDate(tx.occurredAt)}
                  amount={formatSignedCents(-tx.amountCents)}
                  category={catName}
                  dailyCash={dailyCashStr}
                  iconName={getCategoryIcon(catName)}
                  isLast={index === recentOutflows.length - 1}
                />
              );
            })
          )}
        </View>
      </View>

      {/* Quick Action Button */}
      <Link href="/modal" asChild>
        <Pressable style={styles.actionButton} onPress={onLogPress}>
          <Text style={[typography.action, styles.actionButtonText]}>
            + Log Quick Expense
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 18,
    paddingBottom: 40,
  },
  heroShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  heroFrame: {
    height: 220,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  heroContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroCenter: {
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#4A4A4D',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  heroAmount: {
    color: '#1A1A1A',
    fontSize: 36,
    marginTop: 2,
    marginBottom: 4,
  },
  heroStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chip: {
    width: 26,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.chipGold,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  dailyCashChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dailyCash,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dailyCashText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 18,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  statLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  statSub: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 4,
  },
  sectionCard: {
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressText: {
    color: colors.textSecondary,
  },
  boldText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  transactionsSection: {
    gap: 8,
  },
  sectionHeader: {
    paddingHorizontal: 4,
  },
  groupedList: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
  },
  actionButton: {
    height: 52,
    borderRadius: radius.sheet,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#000000',
    fontWeight: '700',
  },
});
