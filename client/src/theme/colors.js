// ─── Color Palette ───────────────────────────────────────────────────────────
export const colors = {
  // Primary brand
  primary: '#4F6EF7',
  primaryDark: '#3A55D4',
  primaryLight: '#7B93FA',

  // Backgrounds (dark theme)
  bg: '#0A0E1A',
  bgCard: '#131929',
  bgElevated: '#1C2438',
  bgInput: '#1C2438',
  border: '#2A3450',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8A9BBE',
  textMuted: '#4A5A7A',
  textInverse: '#0A0E1A',

  // Status
  success: '#22C55E',
  successBg: '#14532D22',
  warning: '#F59E0B',
  warningBg: '#78350F22',
  error: '#EF4444',
  errorBg: '#7F1D1D22',
  info: '#3B82F6',
  infoBg: '#1E3A5F22',

  // Status badges
  pending: '#F59E0B',
  secretaryApproved: '#3B82F6',
  approved: '#22C55E',
  rejected: '#EF4444',
  cancelled: '#6B7280',
  completed: '#8B5CF6',
  rescheduled: '#EC4899',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.7)',
  divider: '#1C2438',
};

export const statusColors = {
  PENDING: colors.pending,
  SECRETARY_APPROVED: colors.secretaryApproved,
  APPROVED: colors.approved,
  REJECTED: colors.rejected,
  CANCELLED: colors.cancelled,
  COMPLETED: colors.completed,
  RESCHEDULED: colors.rescheduled,
};
