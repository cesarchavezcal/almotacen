import React, { useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { GroupsSettingsView, CategoryGroupModal } from '@/src/components/settings';
import { CategoryGroup } from '@/src/storage/types';

export default function GroupsSettingsScreen(): React.JSX.Element {
  const {
    groups,
    state,
    createCategoryGroup,
    updateCategoryGroup,
    deleteCategoryGroup,
  } = useLedgerStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleOpenAdd = useCallback(() => {
    setEditingGroup(null);
    setName('');
    setErrorMessage(null);
    setModalVisible(true);
  }, []);

  const handleOpenEdit = useCallback((group: CategoryGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setErrorMessage(null);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingGroup(null);
    setErrorMessage(null);
  }, []);

  const handleSaveGroup = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Category group name cannot be empty.');
      return;
    }

    try {
      if (editingGroup) {
        updateCategoryGroup({
          id: editingGroup.id,
          name: trimmed,
        });
      } else {
        createCategoryGroup({
          name: trimmed,
        });
      }
      handleCloseModal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save category group.');
    }
  }, [name, editingGroup, createCategoryGroup, updateCategoryGroup, handleCloseModal]);

  const handleDeleteGroup = useCallback(() => {
    if (!editingGroup) return;
    const groupToDeleteId = editingGroup.id;
    const groupName = editingGroup.name;

    Alert.alert(
      'Delete Group?',
      `Are you sure you want to delete "${groupName}"? Child categories must be removed first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This cannot be undone. Are you sure you want to permanently delete this category group?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Permanently Delete',
                  style: 'destructive',
                  onPress: () => {
                    try {
                      deleteCategoryGroup(groupToDeleteId);
                      handleCloseModal();
                    } catch (err: unknown) {
                      setErrorMessage(err instanceof Error ? err.message : 'Cannot delete category group.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [editingGroup, deleteCategoryGroup, handleCloseModal]);

  return (
    <>
      <GroupsSettingsView
        groups={sortedGroups}
        categoryCountPerGroup={categoryCountPerGroup}
        onAddGroup={handleOpenAdd}
        onSelectGroup={handleOpenEdit}
      />
      <CategoryGroupModal
        visible={modalVisible}
        isEditing={Boolean(editingGroup)}
        name={name}
        errorMessage={errorMessage}
        onNameChange={(text) => {
          setName(text);
          if (errorMessage) setErrorMessage(null);
        }}
        onDismissError={() => setErrorMessage(null)}
        onSave={handleSaveGroup}
        onDelete={editingGroup ? handleDeleteGroup : undefined}
        onClose={handleCloseModal}
      />
    </>
  );
}
