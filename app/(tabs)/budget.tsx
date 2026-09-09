import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { EnvelopePassFace } from '@/src/components/EnvelopePassFace';

interface CategoryItem {
  id: string;
  name: string;
  assigned: number;
  activity: number;
  available: number;
  accentColor?: string;
}

interface CategoryGroup {
  name: string;
  items: CategoryItem[];
}

const BUDGET_GROUPS: CategoryGroup[] = [
  {
    name: 'Immediate Obligations',
    items: [
      { id: 'groceries', name: 'Groceries & Provisions', assigned: 650, activity: -342.5, available: 307.5, accentColor: colors.systemBlue },
      { id: 'rent', name: 'Housing & Rent', assigned: 1800, activity: -1800, available: 0, accentColor: colors.warning },
      { id: 'utilities', name: 'Utilities & Internet', assigned: 220, activity: -165, available: 55, accentColor: colors.systemBlue },
    ],
  },
  {
    name: 'True Expenses',
    items: [
      { id: 'auto', name: 'Auto Maintenance', assigned: 150, activity: 0, available: 150, accentColor: colors.success },
      { id: 'health', name: 'Medical & Dental', assigned: 100, activity: -45, available: 55, accentColor: colors.systemBlue },
      { id: 'insurance', name: 'Annual Insurance', assigned: 125, activity: 0, available: 125, accentColor: colors.success },
    ],
  },
  {
    name: 'Quality of Life & Goals',
    items: [
      { id: 'dining', name: 'Dining Out', assigned: 200, activity: -182, available: 18, accentColor: colors.warning },
      { id: 'vacation', name: 'Vacation Fund', assigned: 350, activity: 0, available: 350, accentColor: colors.success },
      { id: 'investing', name: 'Index Funds', assigned: 500, activity: -500, available: 0, accentColor: colors.textTertiary },
    ],
  },
];

export default function BudgetScreen() {
  const totalAssigned = BUDGET_GROUPS.flatMap((g) => g.items).reduce((sum, item) => sum + item.assigned, 0);
  const totalAvailable = BUDGET_GROUPS.flatMap((g) => g.items).reduce((sum, item) => sum + item.available, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Ready to Assign PassKit Badge Header */}
      <View style={styles.rtaCard}>
        <View style={styles.rtaTopRow}>
          <Text style={styles.rtaSubtitle}>READY TO ASSIGN</Text>
          <View style={styles.zeroPill}>
            <Text style={styles.zeroPillText}>ZERO-BASED</Text>
          </View>
        </View>

        <Text style={[typography.balanceHero, styles.rtaAmount]}>$0.00</Text>
        <Text style={styles.rtaDescription}>
          All dollars have been given a job • Every dollar accounted for
        </Text>
      </View>

      {/* Summary Totals Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { marginRight: 6 }]}>
          <Text style={styles.summaryLabel}>TOTAL ASSIGNED</Text>
          <Text style={[typography.title, styles.summaryValue]}>
            ${totalAssigned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[styles.summaryCard, { marginLeft: 6 }]}>
          <Text style={styles.summaryLabel}>TOTAL AVAILABLE</Text>
          <Text style={[typography.title, styles.summaryValue, { color: colors.success }]}>
            ${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Category Groups rendered with EnvelopePassFace cards */}
      {BUDGET_GROUPS.map((group) => (
        <View key={group.name} style={styles.groupSection}>
          <Text style={[typography.sectionHdr, styles.groupHeader]}>
            {group.name}
          </Text>
          <View style={styles.passesColumn}>
            {group.items.map((item) => (
              <EnvelopePassFace
                key={item.id}
                name={item.name}
                group={group.name}
                assigned={item.assigned}
                activity={item.activity}
                available={item.available}
                accentColor={item.accentColor}
                style={styles.envelopePass}
              />
            ))}
          </View>
        </View>
      ))}
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
  rtaCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  rtaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rtaSubtitle: {
    ...typography.sectionHdr,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  zeroPill: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  zeroPillText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rtaAmount: {
    color: colors.success,
    marginTop: 6,
    marginBottom: 4,
  },
  rtaDescription: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  summaryLabel: {
    ...typography.sectionHdr,
    fontSize: 11,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 20,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  groupSection: {
    gap: 12,
  },
  groupHeader: {
    paddingHorizontal: 4,
  },
  passesColumn: {
    gap: 14,
  },
  envelopePass: {
    marginHorizontal: 0, // Inset managed by screen container
  },
});
