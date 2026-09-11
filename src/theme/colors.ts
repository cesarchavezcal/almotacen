export const colors = {
  // Canvas & surfaces
  canvas: '#000000', // TRUE BLACK — not #1C1C1E
  surface1: '#1C1C1E',
  surface2: '#2C2C2E',
  glass: 'rgba(255,255,255,0.12)',
  hairline: '#262629',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A5',
  textTertiary: '#636368',

  // Semantic UI labels (backwards compatible)
  label: '#FFFFFF',
  secondaryLabel: '#A0A0A5',
  tertiaryLabel: '#636368',
  background: '#000000',
  surfaceCard: '#1C1C1E',
  surfaceCardSubtle: '#2C2C2E',
  border: '#262629',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',

  // Apple Card titanium gradient stops
  titaniumHi: '#E8E8EB',
  titaniumMid: '#A8A8AD',
  titaniumLo: '#3D3D3F',
  chipGold: '#C7AC73',
  dailyCash: '#FF3B30',

  // Semantic (HIG dark mode)
  systemBlue: '#0A84FF',
  primary: '#0A84FF',
  primaryDark: '#0071E3',
  onPrimary: '#FFFFFF',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',

  // Status & Financial Indicators
  inflow: '#30D158',
  inflowBg: 'rgba(48, 209, 88, 0.15)',
  outflow: '#FF453A',
  outflowBg: 'rgba(255, 69, 58, 0.15)',
  neutral: '#A0A0A5',

  // Brand hints
  chaseBlue: '#1A2D4F',
  amexSilver: '#A7B0B7',
  visaNavy: '#1A1F71',

  // Interactive alpha overlays
  pressedOverlay: 'rgba(255, 255, 255, 0.08)',
  pressedOverlayDark: 'rgba(0, 0, 0, 0.2)',
} as const;

export type WalletColor = keyof typeof colors;
