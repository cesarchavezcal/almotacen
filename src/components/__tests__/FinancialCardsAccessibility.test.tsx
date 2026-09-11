import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { TransactionRow } from '../TransactionRow';
import { AppleCardFace } from '../AppleCardFace';
import { CreditCardFace } from '../CreditCardFace';
import { EnvelopePassFace } from '../EnvelopePassFace';

describe('Financial Cards & Rows Accessibility (SCEN-043, SCEN-044, SCEN-045)', () => {
  it('SCEN-043: TransactionRow generates descriptive accessibilityLabel and accessible role', () => {
    const row = TransactionRow({
      merchant: 'Trader Joe’s',
      date: 'Today',
      amount: '$45.00',
      category: 'Groceries',
      isOutflow: true,
      onPress: () => {},
    });

    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toContain('Trader Joe’s');
    expect(row.props.accessibilityLabel).toContain('Groceries');
    expect(row.props.accessibilityLabel).toContain('Today');
    expect(row.props.accessibilityLabel).toContain('Outflow $45.00');
  });

  it('SCEN-044: AppleCardFace and CreditCardFace produce full screen reader summary', () => {
    const appleCard = AppleCardFace({
      cardholder: 'Cesar Chavez',
      balance: '$1,425.50',
    });

    expect(appleCard.props.accessible).toBe(true);
    expect(appleCard.props.accessibilityLabel).toContain('Apple Card');
    expect(appleCard.props.accessibilityLabel).toContain('$1,425.50');

    const creditCard = CreditCardFace({
      issuer: 'Chase Sapphire Preferred',
      last4: '4521',
      balance: '-$1,120.30',
      gradient: ['#1A2D4F', '#0E1B30'],
    });

    expect(creditCard.props.accessible).toBe(true);
    expect(creditCard.props.accessibilityLabel).toContain('Chase Sapphire Preferred ending in 4521');
    expect(creditCard.props.accessibilityLabel).toContain('Balance -$1,120.30');
  });

  it('SCEN-045: EnvelopePassFace announces envelope category, status, and available balance', () => {
    const pass = EnvelopePassFace({
      name: 'Groceries',
      group: 'Immediate Obligations',
      assignedCents: 50000,
      activityCents: -15000,
      availableCents: 35000,
    });

    expect(pass.props.accessible).toBe(true);
    expect(pass.props.accessibilityLabel).toContain('Groceries');
    expect(pass.props.accessibilityLabel).toContain('Available Balance');
    expect(pass.props.accessibilityLabel).toContain('$350.00');
  });
});
