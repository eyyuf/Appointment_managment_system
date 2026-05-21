// ─── Color Palette ───────────────────────────────────────────────────────────
// 60-30-10 Rule applied to both light and dark themes.

// ── LIGHT THEME ──────────────────────────────────────────────────────────────
export const lightColors = {
  // 10% Accent · Soft Sky Blue
  primary: '#5BA4CF',
  primaryDark: '#4A8DB8',
  primaryLight: '#A8CFEA',

  // 60% Dominant · Off-White Backgrounds
  bg: '#F7F8FA',
  bgCard: '#FFFFFF',
  bgElevated: '#ECEEF2',
  bgInput: '#F0F2F6',
  border: '#DDE1E9',

  // 30% Secondary · Soft Charcoal Text
  textPrimary: '#2C3040',
  textSecondary: '#6B7280',
  textMuted: '#A0A8B4',
  textInverse: '#F7F8FA',

  // Supporting accents
  success: '#5D9E7C',
  successBg: '#EBF5F0',
  warning: '#D4954A',
  warningBg: '#FDF3E7',
  error: '#C0616B',
  errorBg: '#FAEDEE',
  info: '#5BA4CF',
  infoBg: '#EBF4FA',

  // Status badges
  pending: '#D4954A',
  secretaryApproved: '#5BA4CF',
  approved: '#5D9E7C',
  rejected: '#C0616B',
  cancelled: '#A0A8B4',
  completed: '#5BA4CF',
  rescheduled: '#9B7EBD',

  // Misc
  white: '#FFFFFF',
  black: '#2C3040',
  transparent: 'transparent',
  overlay: 'rgba(44,48,64,0.35)',
  divider: '#E8EAF0',
};

// ── DARK THEME ───────────────────────────────────────────────────────────────
// 60% Deep navy-black · 30% Soft white/silver · 10% Lighter sky blue accent
export const darkColors = {
  // 10% Accent · Lighter sky blue (more visible on dark)
  primary: '#6EB5E0',
  primaryDark: '#5BA4CF',
  primaryLight: '#3A6A8A',

  // 60% Dominant · Deep Dark Backgrounds
  bg: '#12141C',
  bgCard: '#1C1F2B',
  bgElevated: '#252836',
  bgInput: '#252836',
  border: '#2F3347',

  // 30% Secondary · Soft White Text
  textPrimary: '#E8EAF0',
  textSecondary: '#8E95AA',
  textMuted: '#56607A',
  textInverse: '#12141C',

  // Supporting accents (slightly lighter for dark background readability)
  success: '#6DBF94',
  successBg: '#1A3328',
  warning: '#E0A85A',
  warningBg: '#2E2112',
  error: '#D97480',
  errorBg: '#2E1519',
  info: '#6EB5E0',
  infoBg: '#142033',

  // Status badges
  pending: '#E0A85A',
  secretaryApproved: '#6EB5E0',
  approved: '#6DBF94',
  rejected: '#D97480',
  cancelled: '#56607A',
  completed: '#6EB5E0',
  rescheduled: '#A98ACA',

  // Misc
  white: '#E8EAF0',
  black: '#12141C',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
  divider: '#2F3347',
};

// Default export (light) for any files that haven't been migrated yet
export const colors = lightColors;

export const statusColors = (c) => ({
  PENDING: c.pending,
  SECRETARY_APPROVED: c.secretaryApproved,
  APPROVED: c.approved,
  REJECTED: c.rejected,
  CANCELLED: c.cancelled,
  COMPLETED: c.completed,
  RESCHEDULED: c.rescheduled,
});

