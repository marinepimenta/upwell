/**
 * UpWell — paleta minimalista, feminina e acolhedora
 * Verde-sage, off-white, detalhes em nude/terracota
 */

export const UpWellColors = {
  // Base
  background: '#FAF9F7',       // off-white atualizado
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Sage
  sage: '#8FAF8F',             // sage atualizado
  sageLight: '#B8C9A8',
  sageDark: '#7A8F6A',

  // Nude / Terracota
  nude: '#D4A574',
  terracotta: '#C4846A',       // terracotta atualizado
  terracottaLight: '#E8C4B0',

  // Texto
  text: '#2D2D2D',             // texto atualizado
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',

  // UI
  tint: '#7A8F6A',             // sage escuro para tabs/links
  tabIconDefault: '#B0B0B0',
  tabIconSelected: '#7A8F6A',
  border: '#E8E6E2',
  borderLight: '#F0EEEA',

  // Cores com opacidade
  sageLight40: 'rgba(184, 201, 168, 0.4)',  // sageLight com 40% opacidade
  sageLight80: 'rgba(184, 201, 168, 0.8)',  // sageLight com 80% opacidade
} as const;

const tintColorLight = UpWellColors.tint;
const tintColorDark = '#B8C9A8';

export default {
  light: {
    text: UpWellColors.text,
    background: UpWellColors.background,
    tint: tintColorLight,
    tabIconDefault: UpWellColors.tabIconDefault,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F7F6F3',
    background: '#1E1E1E',
    tint: tintColorDark,
    tabIconDefault: '#6A6A6A',
    tabIconSelected: tintColorDark,
  },
};
