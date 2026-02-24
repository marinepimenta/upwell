/**
 * UpWell — sistema de design global
 * Paleta, gradientes, sombras e border radius centralizados
 */

export const colors = {
  background: '#FAFAF8',
  sageDark: '#5C7A5C',
  sage: '#8FAF8F',
  sageLight: '#C8DEC8',
  terracotta: '#C4846A',
  terracottaLight: '#F0D4C8',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  white: '#FFFFFF',
  progressBg: '#E8EDE8',
  borderLight: '#E8EDE8',
  borderMuted: '#D0D8D0',
  borderSage: '#C8DEC8',
  glassBorder: 'rgba(220, 235, 220, 0.6)',
  glassBg: 'rgba(255, 255, 255, 0.75)',
  glassBgRitmo: 'rgba(248, 252, 248, 0.8)',
  glassBorderRitmo: 'rgba(200, 222, 200, 0.5)',
  cardGradientFrom: '#FFFFFF',
  cardGradientTo: '#F5F8F5',
  contentCardFrom: '#F5F8F5',
  contentCardTo: '#FFFFFF',
  contentCardBorder: '#E0EAE0',
} as const;

export const gradients = {
  gradientSage: ['#5C7A5C', '#8FAF8F'] as const,
  gradientTerracotta: ['#C4846A', '#E8A882'] as const,
  gradientCard: ['#FFFFFF', '#F5F8F5'] as const,
  gradientHeader: ['#F0F5F0', '#FAFAF8'] as const,
} as const;

export const shadows = {
  card: {
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDestaque: {
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  glowSage: {
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  glowTerracotta: {
    shadowColor: '#C4846A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export const radius = {
  sm: 8,
  card: 20,
  button: 14,
  chip: 24,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  greeting: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  dayLabel: { fontSize: 15, color: colors.sage },
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  titleSmall: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500' as const, color: colors.textSecondary },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;
