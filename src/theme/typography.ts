import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '800', color: colors.label },
  title: { fontSize: 22, fontWeight: '700', color: colors.label },
  headline: { fontSize: 17, fontWeight: '600', color: colors.label },
  body: { fontSize: 16, fontWeight: '400', color: colors.label },
  subhead: { fontSize: 14, fontWeight: '500', color: colors.secondaryLabel },
  caption: { fontSize: 12, fontWeight: '400', color: colors.tertiaryLabel },
} as const satisfies Record<string, TextStyle>;
