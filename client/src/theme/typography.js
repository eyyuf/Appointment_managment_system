import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const globalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Cards
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Text
  h1: { fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  h2: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  h3: { fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  h4: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  body: { fontSize: typography.size.base, color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: typography.size.sm, color: colors.textMuted },

  // Shadow
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
