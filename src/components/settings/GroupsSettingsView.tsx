import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { CategoryGroup } from '@/src/storage/types';
import { colors } from '@/src/theme';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsHeaderRow } from './SettingsHeaderRow';

export interface GroupsSettingsViewProps {
  groups: CategoryGroup[];
  categoryCountPerGroup: Record<string, number>;
  onAddGroup?: () => void;
  onSelectGroup?: (group: CategoryGroup) => void;
}

export function GroupsSettingsView({
  groups,
  categoryCountPerGroup,
  onAddGroup,
  onSelectGroup,
}: GroupsSettingsViewProps): React.JSX.Element {
  return (
    <ScrollView
      testID="settings-groups-screen"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <SettingsHeaderRow
        subtitle="CATEGORIES HIERARCHY"
        title={`${groups.length} Groups`}
        addLabel="Add Group"
        onAdd={onAddGroup}
        testID="btn-add-group"
      />

      <SettingsSection
        title={`CATEGORY GROUPS (${groups.length})`}
        testID="section-groups-list"
      >
        {groups.length === 0 ? (
          <SettingsRow
            label="No Groups Configured"
            subtitle="Tap '+ Add Group' to create one"
            showChevron={false}
            isLast={true}
          />
        ) : (
          groups.map((group, index) => {
            const count = categoryCountPerGroup[group.id] || 0;
            const isLast = index === groups.length - 1;
            return (
              <SettingsRow
                key={group.id}
                testID={`group-row-${group.id}`}
                iconName="folder-outline"
                iconColor={colors.warning}
                iconBgColor="rgba(255, 159, 10, 0.15)"
                label={group.name}
                subtitle={`Order #${group.sortOrder}`}
                value={`${count} ${count === 1 ? 'item' : 'items'}`}
                showChevron={true}
                onPress={onSelectGroup ? () => onSelectGroup(group) : undefined}
                isLast={isLast}
              />
            );
          })
        )}
      </SettingsSection>
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
