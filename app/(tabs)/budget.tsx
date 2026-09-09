import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface CategoryItem {
  id: string;
  name: string;
  assigned: number;
  activity: number;
  available: number;
}

interface CategoryGroup {
  name: string;
  items: CategoryItem[];
}

const BUDGET_GROUPS: CategoryGroup[] = [
  {
    name: 'Immediate Obligations',
    items: [
      { id: 'rent', name: 'Housing & Rent', assigned: 1800, activity: -1800, available: 0 },
      { id: 'groceries', name: 'Groceries', assigned: 650, activity: -342.5, available: 307.5 },
      { id: 'utilities', name: 'Utilities & Internet', assigned: 220, activity: -165, available: 55 },
    ],
  },
  {
    name: 'True Expenses',
    items: [
      { id: 'auto', name: 'Auto Maintenance', assigned: 150, activity: 0, available: 150 },
      { id: 'health', name: 'Medical & Dental', assigned: 100, activity: -45, available: 55 },
      { id: 'insurance', name: 'Annual Insurance', assigned: 125, activity: 0, available: 125 },
    ],
  },
  {
    name: 'Quality of Life & Goals',
    items: [
      { id: 'dining', name: 'Dining Out', assigned: 200, activity: -182, available: 18 },
      { id: 'vacation', name: 'Vacation Fund', assigned: 350, activity: 0, available: 350 },
      { id: 'investing', name: 'Index Funds', assigned: 500, activity: -500, available: 0 },
    ],
  },
];

export default function BudgetScreen() {
  const colorScheme = useColorScheme();

  const totalAssigned = BUDGET_GROUPS.flatMap((g) => g.items).reduce((sum, item) => sum + item.assigned, 0);
  const totalAvailable = BUDGET_GROUPS.flatMap((g) => g.items).reduce((sum, item) => sum + item.available, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Zero-Based Envelope Budget Banner */}
      <View style={styles.readyToAssignCard}>
        <View style={styles.rtaHeader}>
          <Text style={styles.rtaTitle}>Ready to Assign</Text>
          <View style={styles.zeroPill}>
            <Text style={styles.zeroPillText}>Zero-Based</Text>
          </View>
        </View>
        <Text style={styles.rtaAmount}>$0.00</Text>
        <Text style={styles.rtaDescription}>All dollars have been given a job! 🎯</Text>
      </View>

      {/* Summary Totals */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { marginRight: 8 }]}>
          <Text style={styles.summaryLabel}>Total Assigned</Text>
          <Text style={styles.summaryValue}>${totalAssigned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={[styles.summaryCard, { marginLeft: 8 }]}>
          <Text style={styles.summaryLabel}>Total Available</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            ${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Category Groups */}
      {BUDGET_GROUPS.map((group) => (
        <View key={group.name} style={styles.groupSection}>
          <Text style={styles.groupTitle}>{group.name}</Text>
          <View style={styles.groupCard}>
            {group.items.map((item, index) => {
              const spentPercent = item.assigned > 0 ? Math.min(100, Math.round((Math.abs(item.activity) / item.assigned) * 100)) : 0;
              const isOverspent = item.available < 0;
              const isDepleted = item.available === 0;

              return (
                <View key={item.id} style={[styles.categoryRow, index > 0 && styles.categoryBorder]}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <View style={styles.categorySubRow}>
                      <Text style={styles.categorySubText}>
                        Assigned: ${item.assigned.toFixed(0)} &bull; Activity: -${Math.abs(item.activity).toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.miniProgressBg}>
                      <View
                        style={[
                          styles.miniProgressFill,
                          {
                            width: `${spentPercent}%`,
                            backgroundColor: isOverspent ? '#EF4444' : isDepleted ? '#64748B' : '#10B981',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.availableBadge}>
                    <Text
                      style={[
                        styles.availableText,
                        {
                          color: isOverspent ? '#EF4444' : isDepleted ? '#94A3B8' : '#10B981',
                        },
                      ]}
                    >
                      ${item.available.toFixed(2)}
                    </Text>
                    <Text style={styles.availableLabel}>Available</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  readyToAssignCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  rtaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  rtaTitle: {
    fontSize: 14,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  zeroPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  zeroPillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  rtaAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 6,
  },
  rtaDescription: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  groupSection: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 8,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  categoryBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categorySubRow: {
    marginTop: 3,
    backgroundColor: 'transparent',
  },
  categorySubText: {
    fontSize: 12,
    color: '#64748B',
  },
  miniProgressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginTop: 6,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  availableBadge: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  availableText: {
    fontSize: 16,
    fontWeight: '700',
  },
  availableLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
});
