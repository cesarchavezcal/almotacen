import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { CardStack } from '@/src/components/CardStack';
import { AppleCardFace } from '@/src/components/AppleCardFace';
import { CreditCardFace } from '@/src/components/CreditCardFace';

export default function AccountsScreen() {
  const cards = [
    <AppleCardFace
      key="apple-card"
      cardholder="CESAR CHAVEZ"
      balance="+$1,425.50"
      style={styles.cardItem}
    />,
    <CreditCardFace
      key="chase-sapphire"
      issuer="Chase Sapphire Preferred"
      last4="4521"
      cardholder="Cesar Chavez"
      network="visa"
      accountType="Credit Card Liability • Limit $18,000"
      balance="-$1,120.30"
      gradient={[colors.chaseBlue, '#0E1B30']}
      style={styles.cardItem}
    />,
    <CreditCardFace
      key="amex-blue"
      issuer="American Express Everyday"
      last4="1003"
      cardholder="Cesar Chavez"
      network="amex"
      accountType="Credit Card Liability • Limit $12,000"
      balance="-$300.00"
      gradient={[colors.amexSilver, '#5A6068']}
      style={styles.cardItem}
    />,
    <CreditCardFace
      key="chase-checking"
      issuer="Chase Primary Checking"
      last4="3321"
      cardholder="Cesar Chavez"
      network="visa"
      accountType="Cash & Depository"
      balance="+$3,250.75"
      gradient={[colors.visaNavy, '#0B1033']}
      style={styles.cardItem}
    />,
    <CreditCardFace
      key="marcus-savings"
      issuer="Marcus High-Yield Savings"
      last4="8832"
      cardholder="Cesar Chavez"
      network="visa"
      accountType="High-Yield Depository • 4.40% APY"
      balance="+$5,000.00"
      gradient={['#1E3A8A', '#0F172A']}
      style={styles.cardItem}
    />,
    <CreditCardFace
      key="vanguard-investments"
      issuer="Vanguard Total Stock Market"
      last4="9914"
      cardholder="Cesar Chavez"
      network="discover"
      accountType="Investments & Retirement • VTSAX"
      balance="+$34,500.00"
      gradient={['#881337', '#4C0519']}
      style={styles.cardItem}
    />,
  ];

  return (
    <View style={styles.container}>
      {/* Net Worth Hero Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>TOTAL NET WORTH</Text>
        <Text style={[typography.balanceHero, styles.headerAmount]}>
          $42,755.95
        </Text>
        <Text style={styles.headerSub}>
          Liquid: <Text style={styles.boldWhite}>$8,250.75</Text> • Debt: <Text style={[styles.boldWhite, { color: colors.error }]}>$1,420.30</Text> • Invested: <Text style={styles.boldWhite}>$34,500.00</Text>
        </Text>
        <Text style={styles.instructionText}>
          Tap any card to inspect and expand physical stack
        </Text>
      </View>

      {/* Interactive Vertical Card Stack */}
      <CardStack
        cards={cards}
        contentContainerStyle={styles.stackContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.canvas,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  headerSubtitle: {
    ...typography.sectionHdr,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  headerAmount: {
    fontSize: 34,
    marginTop: 4,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  headerSub: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  instructionText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 6,
  },
  stackContent: {
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  cardItem: {
    marginHorizontal: 16,
  },
});
