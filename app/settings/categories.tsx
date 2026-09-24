import React, { useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { CategoriesSettingsView, CategoryModal } from '@/src/components/settings';
import { Category, TargetType } from '@/src/domain/ledger/types';
import { formatCentsToCurrency, parseCurrencyToCents } from '@/src/domain/ledger/currency';

export default function CategoriesSettingsScreen(): React.JSX.Element {
  const {
    groups,
    state,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useLedgerStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [targetAmountInput, setTargetAmountInput] = useState('$0.00');
  const [targetType, setTargetType] = useState<TargetType>('NEEDED_FOR_SPENDING');
  const [targetDueDayInput, setTargetDueDayInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleOpenAdd = useCallback(() => {
    setEditingCategory(null);
    setName('');
    setGroupId(groups[0]?.id || '');
    setTargetAmountInput('$0.00');
    setTargetType('NEEDED_FOR_SPENDING');
    setTargetDueDayInput('');
    setErrorMessage(null);
    setModalVisible(true);
  }, [groups]);

  const handleOpenEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setGroupId(category.groupId);
    setTargetAmountInput(formatCentsToCurrency(category.targetCents || 0));
    setTargetType(category.targetType || 'NEEDED_FOR_SPENDING');
    setTargetDueDayInput(
      category.targetDueDay !== undefined && category.targetDueDay !== null
        ? String(category.targetDueDay)
        : ''
    );
    setErrorMessage(null);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingCategory(null);
    setErrorMessage(null);
  }, []);

  const handleSaveCategory = useCallback(() => {
    if (editingCategory?.isCreditPayment) {
      setErrorMessage('Credit card payment categories cannot be modified directly.');
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Category name cannot be empty.');
      return;
    }

    if (!groupId) {
      setErrorMessage('Please select a category group.');
      return;
    }

    let targetCents = 0;
    const trimmedTarget = targetAmountInput.trim();
    if (trimmedTarget) {
      const numericOnly = trimmedTarget.replace(/[$,\s]/g, '');
      if (numericOnly.length > 0 && isNaN(Number(numericOnly))) {
        setErrorMessage('Please enter a valid target amount.');
        return;
      }
      targetCents = parseCurrencyToCents(trimmedTarget);
    }

    let targetDueDay: number | undefined = undefined;
    if (targetDueDayInput.trim()) {
      const parsedDay = parseInt(targetDueDayInput.trim(), 10);
      if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        setErrorMessage('Target due day must be between 1 and 31.');
        return;
      }
      targetDueDay = parsedDay;
    }

    try {
      if (editingCategory) {
        updateCategory({
          id: editingCategory.id,
          name: trimmed,
          groupId,
          targetCents,
          targetType,
          targetDueDay,
        });
      } else {
        createCategory({
          name: trimmed,
          groupId,
          targetCents,
          targetType,
          targetDueDay,
        });
      }
      handleCloseModal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save category.');
    }
  }, [
    editingCategory,
    name,
    groupId,
    targetAmountInput,
    targetType,
    targetDueDayInput,
    createCategory,
    updateCategory,
    handleCloseModal,
  ]);

  const handleDeleteCategory = useCallback(() => {
    if (!editingCategory) return;
    const categoryToDeleteId = editingCategory.id;
    const categoryName = editingCategory.name;

    Alert.alert(
      'Delete Category?',
      `Are you sure you want to delete "${categoryName}"? Balance must be zero and without linked transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This cannot be undone. Are you sure you want to permanently delete this category?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Permanently Delete',
                  style: 'destructive',
                  onPress: () => {
                    try {
                      deleteCategory(categoryToDeleteId);
                      handleCloseModal();
                    } catch (err: unknown) {
                      setErrorMessage(err instanceof Error ? err.message : 'Cannot delete category.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [editingCategory, deleteCategory, handleCloseModal]);

  return (
    <>
      <CategoriesSettingsView
        groupedCategories={groupedCategories}
        totalCategories={totalCategories}
        onAddCategory={handleOpenAdd}
        onSelectCategory={handleOpenEdit}
      />
      <CategoryModal
        visible={modalVisible}
        isEditing={Boolean(editingCategory)}
        isCreditPayment={Boolean(editingCategory?.isCreditPayment)}
        name={name}
        groupId={groupId}
        groups={groups}
        targetAmountInput={targetAmountInput}
        targetType={targetType}
        targetDueDayInput={targetDueDayInput}
        errorMessage={errorMessage}
        onNameChange={(text) => {
          setName(text);
          if (errorMessage) setErrorMessage(null);
        }}
        onGroupIdChange={(id) => {
          setGroupId(id);
          if (errorMessage) setErrorMessage(null);
        }}
        onTargetAmountChange={(text) => {
          setTargetAmountInput(text);
          if (errorMessage) setErrorMessage(null);
        }}
        onTargetTypeChange={(type) => {
          setTargetType(type);
          if (errorMessage) setErrorMessage(null);
        }}
        onDueDayChange={(text) => {
          setTargetDueDayInput(text);
          if (errorMessage) setErrorMessage(null);
        }}
        onDismissError={() => setErrorMessage(null)}
        onSave={handleSaveCategory}
        onDelete={editingCategory && !editingCategory.isCreditPayment ? handleDeleteCategory : undefined}
        onClose={handleCloseModal}
      />
    </>
  );
}
