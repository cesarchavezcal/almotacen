import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '@/src/theme';

export interface SettingsRowProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  label: string;
  value?: string | number;
  subtitle?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function SettingsRow({
  iconName,
  iconColor,
  iconBgColor,
  label,
  value,
  subtitle,
  onPress,
  isDestructive = false,
  showChevron,
  isLast = false,
  testID,
  style,
}: SettingsRowProps): React.JSX.Element {
  const shouldShowChevron = showChevron ?? (Boolean(onPress) && !isDestructive);

  const rowContent = (
    <View style={[styles.innerRow, isLast && styles.lastInnerRow, style]}>
      {iconName && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconBgColor ?? colors.surface2 },
          ]}
        >
          <Ionicons
            name={iconName}
            size={16}
            color={iconColor ?? (isDestructive ? colors.error : colors.textPrimary)}
          />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text
          style={[
            typography.body,
            styles.label,
            isDestructive && styles.destructiveLabel,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle && (
          <Text style={[typography.caption, styles.subtitle]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.trailingContainer}>
        {value !== undefined && (
          <Text style={[typography.bodyMedium, styles.value]}>
            {value}
          </Text>
        )}
        {shouldShowChevron && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
            style={styles.chevron}
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        {rowContent}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={styles.container}>
      {rowContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
  },
  pressable: {
    backgroundColor: colors.surface1,
  },
  pressed: {
    backgroundColor: colors.surface2,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  lastInnerRow: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: colors.textPrimary,
  },
  destructiveLabel: {
    color: colors.error,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  trailingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  value: {
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: 6,
  },
});
