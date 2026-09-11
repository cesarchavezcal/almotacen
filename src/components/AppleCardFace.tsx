import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, shadows, spacing } from '@/src/theme';

export interface AppleCardFaceProps {
  cardholder?: string;
  balance?: string;
  style?: StyleProp<ViewStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export function AppleCardFace({
  cardholder = 'CESAR CHAVEZ',
  balance,
  style,
  accessible = true,
  accessibilityLabel,
}: AppleCardFaceProps) {
  const defaultLabel = `Apple Card, Cardholder ${cardholder}${
    balance ? `, Current Balance ${balance}` : ''
  }`;

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || defaultLabel}
      style={[styles.shadow, style]}
    >
      <View style={styles.frame}>
        <LinearGradient
          colors={[colors.titaniumHi, colors.titaniumMid, colors.titaniumLo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.chip} />
            <Ionicons name="logo-apple" size={24} color="#1A1A1A" />
          </View>
          {balance ? (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={[typography.balanceHero, { color: '#1A1A1A' }]}>{balance}</Text>
            </View>
          ) : null}
          <View style={styles.bottomRow}>
            <Text style={[typography.cardHolder, { color: '#1A1A1A' }]}>
              {cardholder.toUpperCase()}
            </Text>
            <View style={styles.dailyCashChip}>
              <Text style={styles.dailyCashText}>$</Text>
            </View>
          </View>
        </View>
        <View style={styles.innerHighlight} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...shadows.hero,
    marginHorizontal: spacing.md,
  },
  frame: {
    height: 220,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    padding: spacing.md + 2,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceContainer: {
    alignItems: 'flex-start',
    marginVertical: spacing.xs,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#4A4A4D',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chip: {
    width: 26,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.chipGold,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  dailyCashChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dailyCash,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  dailyCashText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 18,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
