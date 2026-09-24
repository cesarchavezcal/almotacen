import React, { useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { CategoriesSettingsView } from '@/src/components/settings';

export default function CategoriesSettingsScreen(): React.JSX.Element {
  const { groups, state } = useLedgerStore();

  const groupedCategories = useMemo(() => {
    const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    return sortedGroups.map((group) => {
      const items = Object.values(state.categories).filter(
        (cat) => cat.groupId === group.id
      );
      return {
        ...group,
        items,
      };
    });
  }, [groups, state.categories]);

  const totalCategories = useMemo(() => {
    return Object.keys(state.categories).length;
  }, [state.categories]);

  const handleAddCategory = useCallback(() => {
    Alert.alert('New Category', 'Category creation will be available in the upcoming release.');
  }, []);

  return (
    <CategoriesSettingsView
      groupedCategories={groupedCategories}
      totalCategories={totalCategories}
      onAddCategory={handleAddCategory}
    />
  );
}
