import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { Card } from '../Card';
import { colors, shadows } from '@/src/theme';

describe('Card Component (SCEN-038, SCEN-039)', () => {
  it('SCEN-038: outline variant renders dark surface without #FFFFFF background leakage', () => {
    const element = Card({ children: null, variant: 'outline' });
    const flattenedStyle = Object.assign({}, ...element.props.style.filter(Boolean));

    expect(flattenedStyle.backgroundColor).toBe(colors.surfaceCard);
    expect(flattenedStyle.backgroundColor).not.toBe('#FFFFFF');
    expect(flattenedStyle.borderColor).toBe(colors.border);
  });

  it('SCEN-038: elevated variant renders dark surface with card shadow', () => {
    const element = Card({ children: null, variant: 'elevated' });
    const flattenedStyle = Object.assign({}, ...element.props.style.filter(Boolean));

    expect(flattenedStyle.backgroundColor).toBe(colors.surfaceCard);
    expect(flattenedStyle.backgroundColor).not.toBe('#FFFFFF');
    expect(flattenedStyle.shadowColor).toBe(shadows.card.shadowColor);
    expect(flattenedStyle.elevation).toBe(shadows.card.elevation);
  });

  it('SCEN-039: hero variant applies hero shadow tokens and dark surface', () => {
    const element = Card({ children: null, variant: 'hero' });
    const flattenedStyle = Object.assign({}, ...element.props.style.filter(Boolean));

    expect(flattenedStyle.backgroundColor).toBe(colors.surfaceCard);
    expect(flattenedStyle.shadowColor).toBe(shadows.hero.shadowColor);
    expect(flattenedStyle.shadowOffset).toEqual(shadows.hero.shadowOffset);
    expect(flattenedStyle.shadowOpacity).toBe(shadows.hero.shadowOpacity);
    expect(flattenedStyle.shadowRadius).toBe(shadows.hero.shadowRadius);
    expect(flattenedStyle.elevation).toBe(shadows.hero.elevation);
  });
});
