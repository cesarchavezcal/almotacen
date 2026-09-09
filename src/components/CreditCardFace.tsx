import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export interface CreditCardFaceProps {
  issuer: string;
  last4: string;
  cardholder?: string;
  network?: 'visa' | 'mastercard' | 'amex' | 'discover';
  gradient: readonly [string, string, ...string[]] | [string, string];
  balance?: string;
  accountType?: string;
  style?: StyleProp<ViewStyle>;
}

export function CreditCardFace({
  issuer,
  last4,
  cardholder = 'CESAR CHAVEZ',
  network = 'visa',
  gradient,
  balance,
  accountType,
  style,
}: CreditCardFaceProps) {
  const renderNetworkBadge = () => {
    switch (network) {
      case 'mastercard':
        return (
          <View style={styles.mcCircles}>
            <View style={[styles.mcCircle, { backgroundColor: '#EB001B', marginRight: -8 }]} />
            <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', opacity: 0.9 }]} />
          </View>
        );
      case 'amex':
        return <Text style={styles.amexText}>AMEX</Text>;
      case 'discover':
        return <Text style={styles.discoverText}>DISCOVER</Text>;
      case 'visa':
      default:
        return <Text style={styles.visaText}>VISA</Text>;
    }
  };

  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.frame}>
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View>
              <Text style={[typography.cardIssuer, { color: '#FFFFFF' }]}>{issuer}</Text>
              {accountType ? (
                <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]}>
                  {accountType}
                </Text>
              ) : null}
            </View>
            <View style={styles.networkBadgeContainer}>
              {renderNetworkBadge()}
            </View>
          </View>

          {balance ? (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={[typography.balanceHero, { color: '#FFFFFF' }]}>{balance}</Text>
            </View>
          ) : null}

          <View style={styles.bottomRow}>
            <Text style={[typography.cardHolder, { color: 'rgba(255,255,255,0.85)' }]}>
              {cardholder.toUpperCase()}
            </Text>
            <Text style={[typography.cardLast4, { color: '#FFFFFF' }]}>•••• {last4}</Text>
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
  networkBadgeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 24,
  },
  balanceContainer: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  visaText: {
    color: '#FFFFFF',
    fontStyle: 'italic',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  amexText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  discoverText: {
    color: '#FF6000',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  mcCircles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
