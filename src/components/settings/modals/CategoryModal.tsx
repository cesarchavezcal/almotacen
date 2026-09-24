import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, TargetType } from '@/src/domain/ledger/types';
import { CategoryGroup } from '@/src/storage/types';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { FormErrorBanner } from './FormErrorBanner';

export interface CategoryModalProps {
  visible: boolean;
  isEditing: boolean;
  isCreditPayment: boolean;
  name: string;
  groupId: string;
  groups: CategoryGroup[];
  targetAmountInput: string;
  targetType: TargetType;
  targetDueDayInput: string;
  errorMessage?: string | null;
  onNameChange: (text: string) => void;
  onGroupIdChange: (groupId: string) => void;
  onTargetAmountChange: (text: string) => void;
  onTargetTypeChange: (targetType: TargetType) => void;
  onDueDayChange: (text: string) => void;
  onDismissError?: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const TARGET_TYPES: Array<{ type: TargetType; label: string }> = [
  { type: 'NEEDED_FOR_SPENDING', label: 'Need for Spending' },
  { type: 'MONTHLY_SET_ASIDE', label: 'Monthly Set-Aside' },
];

export function CategoryModal({
  visible,
  isEditing,
  isCreditPayment,
  name,
  groupId,
  groups,
  targetAmountInput,
  targetType,
  targetDueDayInput,
  errorMessage,
  onNameChange,
  onGroupIdChange,
  onTargetAmountChange,
  onTargetTypeChange,
  onDueDayChange,
  onDismissError,
  onSave,
  onDelete,
  onClose,
}: CategoryModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.sheetContainer} testID="category-modal-sheet">
          <View style={styles.header}>
            <Pressable
              testID="btn-cancel-category"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onClose}
              style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              {isEditing ? (isCreditPayment ? 'Payment Envelope' : 'Edit Category') : 'New Category'}
            </Text>

            {!isCreditPayment ? (
              <Pressable
                testID="btn-save-category"
                accessibilityRole="button"
                accessibilityLabel={isEditing ? 'Save Category' : 'Create Category'}
                onPress={onSave}
                style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.saveText}>{isEditing ? 'Save' : 'Add'}</Text>
              </Pressable>
            ) : (
              <View style={styles.headerButton} />
            )}
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <FormErrorBanner message={errorMessage} onDismiss={onDismissError} />

            {isCreditPayment && (
              <View style={styles.creditNotice} testID="credit-payment-notice">
                <Ionicons name="lock-closed-outline" size={16} color={colors.warning} />
                <Text style={styles.creditNoticeText}>
                  This is a system-managed credit card payment reserve category.
                </Text>
              </View>
            )}

            {/* Category Name */}
            <Text style={styles.fieldLabel}>CATEGORY NAME</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-category-name"
                accessibilityLabel="Category name input"
                editable={!isCreditPayment}
                style={[styles.textInput, isCreditPayment && styles.textInputDisabled]}
                placeholder="e.g. Groceries, Electric, Dining Out"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={onNameChange}
                autoFocus={!isEditing && !isCreditPayment}
              />
            </View>

            {/* Group Selector */}
            <Text style={styles.fieldLabel}>PARENT GROUP</Text>
            <View style={styles.groupChipsContainer} testID="selector-category-group">
              {groups.map((group) => {
                const isSelected = groupId === group.id;
                return (
                  <Pressable
                    key={group.id}
                    testID={`group-chip-${group.id}`}
                    disabled={isCreditPayment}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.groupChip,
                      isSelected && styles.groupChipSelected,
                      isCreditPayment && !isSelected && styles.groupChipDisabled,
                      pressed && !isCreditPayment && styles.buttonPressed,
                    ]}
                    onPress={() => onGroupIdChange(group.id)}
                  >
                    <Text
                      style={[
                        styles.groupChipText,
                        isSelected && styles.groupChipTextSelected,
                      ]}
                    >
                      {group.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Target Amount */}
            <Text style={styles.fieldLabel}>TARGET MONTHLY BUDGET</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-category-target-amount"
                accessibilityLabel="Target monthly budget input"
                editable={!isCreditPayment}
                style={[styles.textInput, isCreditPayment && styles.textInputDisabled]}
                placeholder="$0.00"
                placeholderTextColor={colors.textTertiary}
                value={targetAmountInput}
                onChangeText={onTargetAmountChange}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Target Type Selector */}
            <Text style={styles.fieldLabel}>TARGET STRATEGY</Text>
            <View style={styles.targetTypeContainer} testID="selector-category-target-type">
              {TARGET_TYPES.map((item) => {
                const isSelected = targetType === item.type;
                return (
                  <Pressable
                    key={item.type}
                    testID={`target-type-${item.type}`}
                    disabled={isCreditPayment}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.targetTypeRow,
                      isSelected && styles.targetTypeRowSelected,
                      pressed && !isCreditPayment && styles.buttonPressed,
                    ]}
                    onPress={() => onTargetTypeChange(item.type)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.systemBlue : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.targetTypeText,
                        isSelected && styles.targetTypeTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Target Due Day */}
            <Text style={styles.fieldLabel}>DUE DAY OF MONTH (OPTIONAL)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-category-due-day"
                accessibilityLabel="Target due day of month input"
                editable={!isCreditPayment}
                style={[styles.textInput, isCreditPayment && styles.textInputDisabled]}
                placeholder="Day 1 - 31"
                placeholderTextColor={colors.textTertiary}
                value={targetDueDayInput}
                onChangeText={onDueDayChange}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            {/* Destructive Delete Button */}
            {isEditing && onDelete && !isCreditPayment && (
              <View style={styles.deleteSection}>
                <Pressable
                  testID="btn-delete-category"
                  accessibilityRole="button"
                  accessibilityLabel="Delete Category"
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={onDelete}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={styles.deleteButtonText}>Delete Category</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '92%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 50,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  saveText: {
    ...typography.action,
    color: colors.systemBlue,
  },
  content: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  creditNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.12)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  creditNoticeText: {
    ...typography.footnote,
    color: colors.warning,
    flex: 1,
  },
  fieldLabel: {
    ...typography.sectionHdr,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 8,
  },
  textInput: {
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  textInputDisabled: {
    opacity: 0.5,
  },
  groupChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  groupChipSelected: {
    backgroundColor: colors.systemBlue,
    borderColor: colors.systemBlue,
  },
  groupChipDisabled: {
    opacity: 0.4,
  },
  groupChipText: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  groupChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  targetTypeContainer: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    marginBottom: 8,
  },
  targetTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  targetTypeRowSelected: {
    backgroundColor: colors.surfaceCardSubtle,
  },
  targetTypeText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  targetTypeTextSelected: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  deleteSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 20,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    ...typography.action,
    color: colors.error,
  },
});
