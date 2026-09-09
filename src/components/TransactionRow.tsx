import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export interface TransactionRowProps {
  merchant: string;
  date: string;
  amount: string;
  category?: string;
  dailyCash?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isOutflow?: boolean;
  onPress?: () => void;
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TransactionRow({
  merchant,
  date,
  amount,
  category,
  dailyCash,
  iconName = 'cart',
  isOutflow = true,
  onPress,
  isLast = false,
  style,
}: TransactionRowProps) {
  const content = (
    <View style={[styles.row, isLast && styles.lastRow, style]}>
      <View style={styles.logo}>
        <Ionicons name={iconName} size={16} color="#FFFFFF" />
      </View>
      <View style={styles.details}>
        <Text style={[typography.body, styles.merchantText]} numberOfLines={1}>
          {merchant}
        </Text>
        <Text style={[typography.footnote, styles.subText]} numberOfLines={1}>
          {category ? `${category} • ${date}` : date}
        </Text>
      </View>
      <View style={styles.amountCol}>
        <Text
          style={[
            typography.bodyMedium,
            styles.amountText,
            { color: isOutflow ? '#FFFFFF' : colors.success },
          ]}
        >
          {amount}
        </Text>
        {dailyCash ? (
          <Text style={[typography.caption, styles.dailyCashText]}>
            Daily Cash {dailyCash}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: colors.surface1,
  },
  pressed: {
    backgroundColor: colors.surface2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface1,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  merchantText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subText: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dailyCashText: {
    color: colors.dailyCash,
    marginTop: 2,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
