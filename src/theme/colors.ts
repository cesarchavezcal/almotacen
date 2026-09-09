import { Platform } from 'react-native';

export const colors = {
  // Semantic UI
  label: Platform.select({
    ios: '#000000',
    android: '#1E293B',
    default: '#0F172A',
  }),
  secondaryLabel: '#64748B',
  tertiaryLabel: '#94A3B8',
  background: '#FFFFFF',
  surfaceCard: '#0F172A',
  surfaceCardSubtle: '#F8FAFC',
  border: 'rgba(148, 163, 184, 0.25)',
  borderSubtle: 'rgba(148, 163, 184, 0.15)',

  // Brand & Accents
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  onPrimary: '#FFFFFF',

  // Status & Financial Indicators
  inflow: '#10B981',
  inflowBg: 'rgba(16, 185, 129, 0.12)',
  outflow: '#EF4444',
  outflowBg: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  neutral: '#64748B',
} as const;
