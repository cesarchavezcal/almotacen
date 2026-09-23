import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, typography, radius } from '@/src/theme';

export interface SettingsSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function SettingsSection({
  title,
  footer,
  children,
  testID,
  style,
}: SettingsSectionProps): React.JSX.Element {
  return (
    <View testID={testID} style={[styles.section, style]}>
      {title && (
        <Text style={[typography.sectionHdr, styles.sectionHeader]}>
          {title}
        </Text>
      )}
      <View style={styles.card}>{children}</View>
      {footer && (
        <Text style={[typography.footnote, styles.sectionFooter]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: colors.textSecondary,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  sectionFooter: {
    color: colors.textTertiary,
    marginTop: 6,
    paddingHorizontal: 8,
  },
});
