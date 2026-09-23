import React, { useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { GroupsSettingsView } from '@/src/components/settings';

export default function GroupsSettingsScreen(): React.JSX.Element {
  const { groups, state } = useLedgerStore();

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [groups]);

  const categoryCountPerGroup = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of Object.values(state.categories)) {
      map[cat.groupId] = (map[cat.groupId] || 0) + 1;
    }
    return map;
  }, [state.categories]);

  const handleAddGroup = useCallback(() => {
    Alert.alert('New Category Group', 'Category group management will be available in the upcoming release.');
  }, []);

  return (
    <GroupsSettingsView
      groups={sortedGroups}
      categoryCountPerGroup={categoryCountPerGroup}
      onAddGroup={handleAddGroup}
    />
  );
}
