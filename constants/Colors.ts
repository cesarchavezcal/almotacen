import { colors } from '@/src/theme/colors';

const tintColor = colors.systemBlue;

export default {
  light: {
    text: colors.textPrimary,
    background: colors.canvas,
    tint: tintColor,
    tabIconDefault: colors.textTertiary,
    tabIconSelected: tintColor,
  },
  dark: {
    text: colors.textPrimary,
    background: colors.canvas,
    tint: tintColor,
    tabIconDefault: colors.textTertiary,
    tabIconSelected: tintColor,
  },
};
