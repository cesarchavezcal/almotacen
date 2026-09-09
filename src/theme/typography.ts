import type { TextStyle } from 'react-native';
import { Platform } from 'react-native';

const sysDisplay = Platform.select({ ios: 'SF Pro Display', default: 'System' });
const sysText = Platform.select({ ios: 'SF Pro Text', default: 'System' });
const sysMono = Platform.select({ ios: 'SF Mono', default: 'monospace' });

export const typography = {
  // Display scale (>= 20pt)
  title: { fontFamily: sysDisplay, fontSize: 34, fontWeight: '700', lineHeight: 38, letterSpacing: 0.36, color: '#FFFFFF' },
  sheetTitle: { fontFamily: sysDisplay, fontSize: 28, fontWeight: '700', lineHeight: 32, letterSpacing: 0.35, color: '#FFFFFF' },
  cardIssuer: { fontFamily: sysDisplay, fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  balanceHero: { fontFamily: sysDisplay, fontSize: 40, fontWeight: '700', fontVariant: ['tabular-nums'], color: '#FFFFFF' },
  dailyCash: { fontFamily: sysDisplay, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], color: '#FFFFFF' },

  // Text scale (<= 17pt)
  body: { fontFamily: sysText, fontSize: 17, fontWeight: '400', lineHeight: 22, letterSpacing: -0.4, color: '#FFFFFF' },
  bodyMedium: { fontFamily: sysText, fontSize: 17, fontWeight: '500', fontVariant: ['tabular-nums'], color: '#FFFFFF' },
  action: { fontFamily: sysText, fontSize: 17, fontWeight: '600', letterSpacing: -0.4, color: '#FFFFFF' },
  sectionHdr: { fontFamily: sysText, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: -0.08, color: '#A0A0A5' },
  footnote: { fontFamily: sysText, fontSize: 13, fontWeight: '400', letterSpacing: -0.08, color: '#A0A0A5' },
  caption: { fontFamily: sysText, fontSize: 11, fontWeight: '400', letterSpacing: 0.07, color: '#636368' },

  // Mono scale
  cardLast4: { fontFamily: sysMono, fontSize: 17, fontWeight: '500', letterSpacing: 0.5, fontVariant: ['tabular-nums'], color: '#FFFFFF' },
  cardHolder: { fontFamily: sysText, fontSize: 13, fontWeight: '500', letterSpacing: 0.3, color: '#FFFFFF' },

  // Backwards compatibility aliases
  largeTitle: { fontFamily: sysDisplay, fontSize: 34, fontWeight: '800', lineHeight: 38, color: '#FFFFFF' },
  headline: { fontFamily: sysText, fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  subhead: { fontFamily: sysText, fontSize: 14, fontWeight: '500', color: '#A0A0A5' },
} satisfies Record<string, TextStyle>;

export type TypographyStyle = keyof typeof typography;
