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
import { Account } from '@/src/domain/ledger/types';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { FormErrorBanner } from './FormErrorBanner';

export interface AccountModalProps {
  visible: boolean;
  isEditing: boolean;
  name: string;
  accountType: Account['accountType'];
  balanceInput: string;
  errorMessage?: string | null;
  onNameChange: (text: string) => void;
  onAccountTypeChange: (type: Account['accountType']) => void;
  onBalanceChange: (text: string) => void;
  onDismissError?: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const ACCOUNT_TYPES: Array<{ type: Account['accountType']; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { type: 'checking', label: 'Checking', icon: 'card-outline' },
  { type: 'savings', label: 'Savings', icon: 'wallet-outline' },
  { type: 'credit', label: 'Credit Card', icon: 'barcode-outline' },
];

export function AccountModal({
  visible,
  isEditing,
  name,
  accountType,
  balanceInput,
  errorMessage,
  onNameChange,
  onAccountTypeChange,
  onBalanceChange,
  onDismissError,
  onSave,
  onDelete,
  onClose,
}: AccountModalProps): React.JSX.Element {
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
        <View style={styles.sheetContainer} testID="account-modal-sheet">
          <View style={styles.header}>
            <Pressable
              testID="btn-cancel-account"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onClose}
              style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Account' : 'New Account'}
            </Text>

            <Pressable
              testID="btn-save-account"
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Save Account' : 'Create Account'}
              onPress={onSave}
              style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.saveText}>{isEditing ? 'Save' : 'Add'}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <FormErrorBanner message={errorMessage} onDismiss={onDismissError} />

            {/* Account Type Selector (disabled in edit mode) */}
            <Text style={styles.fieldLabel}>ACCOUNT TYPE</Text>
            <View style={styles.segmentContainer} testID="selector-account-type">
              {ACCOUNT_TYPES.map((item) => {
                const isSelected = accountType === item.type;
                return (
                  <Pressable
                    key={item.type}
                    testID={`type-option-${item.type}`}
                    disabled={isEditing}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.segmentButton,
                      isSelected && styles.segmentButtonSelected,
                      isEditing && !isSelected && styles.segmentButtonDisabled,
                      pressed && !isEditing && styles.buttonPressed,
                    ]}
                    onPress={() => onAccountTypeChange(item.type)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={isSelected ? colors.textPrimary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        isSelected && styles.segmentTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Account Name */}
            <Text style={styles.fieldLabel}>ACCOUNT NAME</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-account-name"
                accessibilityLabel="Account name input"
                style={styles.textInput}
                placeholder="e.g. Chase Freedom, Main Checking"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={onNameChange}
                autoFocus={!isEditing}
              />
            </View>

            {/* Balance */}
            <Text style={styles.fieldLabel}>
              {isEditing ? 'CURRENT BALANCE' : accountType === 'credit' ? 'STARTING DEBT' : 'STARTING BALANCE'}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-account-balance"
                accessibilityLabel="Account balance input"
                style={styles.textInput}
                placeholder="$0.00"
                placeholderTextColor={colors.textTertiary}
                value={balanceInput}
                onChangeText={onBalanceChange}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Destructive Delete Button */}
            {isEditing && onDelete && (
              <View style={styles.deleteSection}>
                <Pressable
                  testID="btn-delete-account"
                  accessibilityRole="button"
                  accessibilityLabel="Delete Account"
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={onDelete}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
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
    maxHeight: '90%',
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
  fieldLabel: {
    ...typography.sectionHdr,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 8,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    gap: 6,
  },
  segmentButtonSelected: {
    backgroundColor: colors.surfaceCardSubtle,
  },
  segmentButtonDisabled: {
    opacity: 0.4,
  },
  segmentText: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
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
