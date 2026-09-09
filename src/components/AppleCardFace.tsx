import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export interface AppleCardFaceProps {
  cardholder?: string;
  balance?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppleCardFace({
  cardholder = 'CESAR CHAVEZ',
  balance,
  style,
}: AppleCardFaceProps) {
  return (
    <View style={[styles.shadow, style]}>
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
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginHorizontal: 16,
  },
  frame: {
    height: 220,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceContainer: {
    alignItems: 'flex-start',
    marginVertical: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dailyCashText: {
    color: '#FFFFFF',
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
