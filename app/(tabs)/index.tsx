import React from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { spacing } from '@/src/theme/spacing';
import { TransactionRow } from '@/src/components/TransactionRow';

export default function CashFlowScreen() {
  const handleLogPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Apple Card Titanium Hero Card */}
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
              <Text style={styles.heroSubtitle}>September Cash Flow</Text>
              <Text style={[typography.balanceHero, styles.heroAmount]}>
                +$1,425.50
              </Text>
              <Text style={styles.heroStatus}>
                On track • Burn rate: 42% of budget
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

      {/* Reactive Flow KPI Split */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { marginRight: spacing.xs + 2 }]}>
          <Text style={styles.statLabel}>TOTAL INFLOW</Text>
          <Text style={[typography.title, styles.statValue, { color: colors.inflow }]}>
            +$4,850.00
          </Text>
          <Text style={styles.statSub}>Paycheck & Transfers</Text>
        </View>

        <View style={[styles.statCard, { marginLeft: spacing.xs + 2 }]}>
          <Text style={styles.statLabel}>TOTAL OUTFLOW</Text>
          <Text style={[typography.title, styles.statValue, { color: colors.outflow }]}>
            -$3,424.50
          </Text>
          <Text style={styles.statSub}>Spent this cycle</Text>
        </View>
      </View>

      {/* Burn Velocity Indicator */}
      <View style={styles.sectionCard}>
        <Text style={typography.sectionHdr}>MONTH TRAJECTORY</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: '42%' }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[typography.footnote, styles.progressText]}>
            Spent: <Text style={styles.boldText}>$3,424.50</Text>
          </Text>
          <Text style={[typography.footnote, styles.progressText]}>
            Remaining: <Text style={styles.boldText}>$1,425.50</Text>
          </Text>
        </View>
      </View>

      {/* Recent Outflows Transaction List */}
      <View style={styles.transactionsSection}>
        <Text style={[typography.sectionHdr, styles.sectionHeader]}>
          RECENT OUTFLOWS
        </Text>
        <View style={styles.groupedList}>
          <TransactionRow
            merchant="Trader Joe's"
            date="Today, 1:45 PM"
            amount="-$84.20"
            category="Groceries"
            dailyCash="+$1.68"
            iconName="cart"
          />
          <TransactionRow
            merchant="Apple Store"
            date="Yesterday"
            amount="-$129.00"
            category="Electronics"
            dailyCash="+$3.87"
            iconName="phone-portrait"
          />
          <TransactionRow
            merchant="Blue Bottle Coffee"
            date="Sep 6"
            amount="-$6.50"
            category="Dining"
            dailyCash="+$0.13"
            iconName="cafe"
          />
          <TransactionRow
            merchant="Uber"
            date="Sep 5"
            amount="-$24.80"
            category="Transportation"
            dailyCash="+$0.50"
            iconName="car"
            isLast
          />
        </View>
      </View>

      {/* Quick Action Button */}
      <Link href="/modal" asChild>
        <Pressable style={styles.actionButton} onPress={handleLogPress}>
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
    color: '#166534',
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
    backgroundColor: colors.systemBlue,
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
