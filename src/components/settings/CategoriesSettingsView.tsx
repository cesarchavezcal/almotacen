import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Category } from '@/src/domain/ledger/types';
import { CategoryGroup } from '@/src/storage/types';
import { formatCentsToCurrency } from '@/src/domain/ledger/currency';
import { colors } from '@/src/theme';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsHeaderRow } from './SettingsHeaderRow';

export interface GroupedCategorySection extends CategoryGroup {
  items: Category[];
}

export interface CategoriesSettingsViewProps {
  groupedCategories: GroupedCategorySection[];
  totalCategories: number;
  onAddCategory?: () => void;
  onSelectCategory?: (category: Category) => void;
}

export function CategoriesSettingsView({
  groupedCategories,
  totalCategories,
  onAddCategory,
  onSelectCategory,
}: CategoriesSettingsViewProps): React.JSX.Element {
  return (
    <ScrollView
      testID="settings-categories-screen"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <SettingsHeaderRow
        subtitle="ENVELOPE CATEGORIES"
        title={`${totalCategories} Categories`}
        addLabel="Add Category"
        onAdd={onAddCategory}
        testID="btn-add-category"
      />

      {groupedCategories.map((group) => (
        <SettingsSection
          key={group.id}
          title={`${group.name.toUpperCase()} (${group.items.length})`}
          testID={`section-category-group-${group.id}`}
        >
          {group.items.length === 0 ? (
            <SettingsRow
              label="No categories in this group"
              showChevron={false}
              isLast={true}
            />
          ) : (
            group.items.map((cat, index) => {
              const isLast = index === group.items.length - 1;
              const hasTarget = cat.targetCents > 0;
              const targetDesc = hasTarget
                ? `Target: ${formatCentsToCurrency(cat.targetCents)}`
                : 'No target set';

              return (
                <SettingsRow
                  key={cat.id}
                  testID={`category-row-${cat.id}`}
                  iconName={cat.isCreditPayment ? 'card' : 'pricetag-outline'}
                  iconColor={cat.isCreditPayment ? colors.warning : colors.success}
                  iconBgColor={
                    cat.isCreditPayment
                      ? 'rgba(255, 159, 10, 0.15)'
                      : 'rgba(48, 209, 88, 0.15)'
                  }
                  label={cat.name}
                  subtitle={targetDesc}
                  value={formatCentsToCurrency(cat.availableCents)}
                  showChevron={true}
                  onPress={onSelectCategory ? () => onSelectCategory(cat) : undefined}
                  isLast={isLast}
                />
              );
            })
          )}
        </SettingsSection>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
