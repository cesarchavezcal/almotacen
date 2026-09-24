import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '@/src/theme';

export interface SettingsHeaderRowProps {
  title: string;
  subtitle: string;
  addLabel?: string;
  onAdd?: () => void;
  testID?: string;
}

export function SettingsHeaderRow({
  title,
  subtitle,
  addLabel,
  onAdd,
  testID,
}: SettingsHeaderRowProps): React.JSX.Element {
  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={[typography.sectionHdr, styles.summaryLabel]}>
          {subtitle}
        </Text>
        <Text style={[typography.title, styles.title]}>
          {title}
        </Text>
      </View>

      {onAdd && addLabel && (
        <Pressable
          testID={testID}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={onAdd}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{addLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.systemBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    gap: 6,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    ...typography.action,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
