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
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { FormErrorBanner } from './FormErrorBanner';

export interface CategoryGroupModalProps {
  visible: boolean;
  isEditing: boolean;
  name: string;
  errorMessage?: string | null;
  onNameChange: (text: string) => void;
  onDismissError?: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function CategoryGroupModal({
  visible,
  isEditing,
  name,
  errorMessage,
  onNameChange,
  onDismissError,
  onSave,
  onDelete,
  onClose,
}: CategoryGroupModalProps): React.JSX.Element {
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
        <View style={styles.sheetContainer} testID="category-group-modal-sheet">
          <View style={styles.header}>
            <Pressable
              testID="btn-cancel-group"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onClose}
              style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Group' : 'New Group'}
            </Text>

            <Pressable
              testID="btn-save-group"
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Save Group' : 'Create Group'}
              onPress={onSave}
              style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.saveText}>{isEditing ? 'Save' : 'Add'}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <FormErrorBanner message={errorMessage} onDismiss={onDismissError} />

            {/* Group Name */}
            <Text style={styles.fieldLabel}>GROUP NAME</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-group-name"
                accessibilityLabel="Category group name input"
                style={styles.textInput}
                placeholder="e.g. Monthly Obligations, Living Expenses"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={onNameChange}
                autoFocus={true}
              />
            </View>

            {/* Destructive Delete Button */}
            {isEditing && onDelete && (
              <View style={styles.deleteSection}>
                <Pressable
                  testID="btn-delete-group"
                  accessibilityRole="button"
                  accessibilityLabel="Delete Category Group"
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={onDelete}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={styles.deleteButtonText}>Delete Group</Text>
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
    maxHeight: '80%',
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
