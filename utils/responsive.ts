import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints baseados em tamanhos comuns de dispositivos
export const BREAKPOINTS = {
  small: 360,      // Celulares pequenos (iPhone SE, etc)
  medium: 414,     // Celulares médios (iPhone 12/13, etc)
  large: 480,      // Celulares grandes (Samsung S21, etc)
  xlarge: 540,     // Celulares muito grandes (S25 Ultra, etc)
};

// Verificar tamanho da tela
export const isSmallScreen = SCREEN_WIDTH < BREAKPOINTS.small;
export const isMediumScreen = SCREEN_WIDTH >= BREAKPOINTS.small && SCREEN_WIDTH < BREAKPOINTS.medium;
export const isLargeScreen = SCREEN_WIDTH >= BREAKPOINTS.medium && SCREEN_WIDTH < BREAKPOINTS.large;
export const isXLargeScreen = SCREEN_WIDTH >= BREAKPOINTS.large;

// Verificar se é tablet
export const isTablet = SCREEN_WIDTH >= 768;

// Verificar aspect ratio (telas finas vs largas)
export const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
export const isNarrowScreen = aspectRatio < 0.5; // Telas muito finas/altas
export const isWideScreen = aspectRatio > 0.6; // Telas mais largas

// Função para obter padding responsivo
export const getResponsivePadding = (base: number = 16) => {
  if (isSmallScreen) return base * 0.75;
  if (isXLargeScreen) return base * 1.25;
  return base;
};

// Função para obter tamanho de fonte responsivo
export const getResponsiveFontSize = (base: number) => {
  if (isSmallScreen) return base * 0.9;
  if (isXLargeScreen) return base * 1.1;
  return base;
};

// Função para obter largura responsiva (percentual)
export const getResponsiveWidth = (percent: number) => {
  return (SCREEN_WIDTH * percent) / 100;
};

// Função para obter altura responsiva (percentual)
export const getResponsiveHeight = (percent: number) => {
  return (SCREEN_HEIGHT * percent) / 100;
};

// Função para obter gap responsivo
export const getResponsiveGap = (base: number = 8) => {
  if (isSmallScreen) return base * 0.75;
  if (isXLargeScreen) return base * 1.25;
  return base;
};

// Função para obter border radius responsivo
export const getResponsiveBorderRadius = (base: number = 12) => {
  if (isSmallScreen) return base * 0.85;
  return base;
};

// Exportar dimensões
export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  aspectRatio,
};

// Função para obter número de colunas em grid responsivo
export const getResponsiveColumns = (defaultColumns: number = 2) => {
  if (isSmallScreen) return Math.max(1, defaultColumns - 1);
  if (isXLargeScreen) return defaultColumns + 1;
  return defaultColumns;
};


