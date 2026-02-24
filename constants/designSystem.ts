/**
 * Tokens do design system UpWell para uso em StyleSheet e componentes.
 * Valores derivados de constants/design_system.json — alterações no JSON
 * devem ser refletidas manualmente neste arquivo. Nenhum JSON é carregado em runtime.
 */

import type { TextStyle } from 'react-native';

// --- Gradients / colors (design_system.json colors)
export const gradientSage = ['#5C7A5C', '#8FAF8F'] as const;
export const onDark = '#FFFFFF';
export const onDarkSubtle = 'rgba(255,255,255,0.75)';
export const sageDark = '#5C7A5C';

// --- Card glassmorphism (components.card.glassmorphism + shadows.md)
const shadowMd = {
  shadowColor: '#5C7A5C',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};
export const cardGlassmorphism = {
  backgroundColor: 'rgba(255,255,255,0.75)' as const,
  borderRadius: 20,
  padding: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.9)' as const,
  ...shadowMd,
};

// --- Typography (typography.scale)
export const typography = {
  displayL: {
    fontSize: 36,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 44,
  },
  titleL: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 32,
  },
  bodyM: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
  },
  bodyS: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
  },
};

// --- Spacing (spacing.scale + screen)
export const spacing = {
  scale: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  cardMarginHorizontal: 24,
  titleSubtitleGap: 24,
  inputGap: 12,
  socialGap: 12,
  footerMarginTop: 20,
  lg: 16,
  xl: 20,
};

// --- Border radius (borderRadius)
export const borderRadius = {
  input: 12,
  button: 14,
  card: 20,
  socialButton: 12,
};

// --- Input onDark (components.inputs.onDark)
export const inputOnDarkStyle = {
  background: 'rgba(255,255,255,0.2)' as const,
  borderWidth: 1 as const,
  borderColor: 'rgba(255,255,255,0.3)' as const,
  borderRadius: 12,
  height: 52,
  paddingHorizontal: 16,
  fontSize: 16,
  color: '#FFFFFF' as const,
  placeholderColor: 'rgba(255,255,255,0.6)' as const,
};

// --- Button white (components.buttons.white)
export const buttonWhiteStyle = {
  background: '#FFFFFF' as const,
  borderRadius: 14,
  height: 52,
  shadowColor: '#FFFFFF' as const,
  shadowOffset: { width: 0, height: 0 } as const,
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 10,
  fontSize: 16,
  fontWeight: '700' as TextStyle['fontWeight'],
  color: '#5C7A5C' as const,
};

// --- Inline error (patterns.inlineError)
export const inlineErrorStyle = {
  fontSize: 13,
  color: 'rgba(180,60,60,0.9)' as const,
  marginTop: 6,
};
export const inlineErrorIconSize = 14;

// --- Social buttons / divider / footer
export const socialButtonStyle = {
  background: 'rgba(255,255,255,0.15)' as const,
  borderWidth: 1 as const,
  borderColor: 'rgba(255,255,255,0.3)' as const,
  borderRadius: 12,
  height: 48,
};
export const dividerLineColor = 'rgba(255,255,255,0.25)';
export const footerHintColor = 'rgba(255,255,255,0.7)';
