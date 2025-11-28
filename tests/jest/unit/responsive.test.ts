import {
  BREAKPOINTS,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isXLargeScreen,
  isTablet,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveGap,
  getResponsiveBorderRadius,
  getResponsiveColumns,
} from '../../../utils/responsive';

// Mock do Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  let mockWidth = 375;
  let mockHeight = 812;

  RN.Dimensions.get = jest.fn(() => ({
    width: mockWidth,
    height: mockHeight,
  }));

  RN.Dimensions.set = (width: number, height: number) => {
    mockWidth = width;
    mockHeight = height;
  };

  return RN;
});

describe('Responsive Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Breakpoints', () => {
    it('deve ter breakpoints definidos corretamente', () => {
      expect(BREAKPOINTS.small).toBe(360);
      expect(BREAKPOINTS.medium).toBe(414);
      expect(BREAKPOINTS.large).toBe(480);
      expect(BREAKPOINTS.xlarge).toBe(540);
    });
  });

  describe('getResponsivePadding', () => {
    it('deve retornar padding reduzido para telas pequenas', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 320, height: 568 }));
      const padding = getResponsivePadding(16);
      expect(padding).toBe(12); // 16 * 0.75
    });

    it('deve retornar padding aumentado para telas muito grandes', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 600, height: 800 }));
      const padding = getResponsivePadding(16);
      expect(padding).toBe(20); // 16 * 1.25
    });

    it('deve retornar padding padrão para telas médias', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 400, height: 800 }));
      const padding = getResponsivePadding(16);
      expect(padding).toBe(16);
    });
  });

  describe('getResponsiveFontSize', () => {
    it('deve retornar fonte reduzida para telas pequenas', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 320, height: 568 }));
      const fontSize = getResponsiveFontSize(16);
      expect(fontSize).toBe(14.4); // 16 * 0.9
    });

    it('deve retornar fonte aumentada para telas muito grandes', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 600, height: 800 }));
      const fontSize = getResponsiveFontSize(16);
      expect(fontSize).toBe(17.6); // 16 * 1.1
    });
  });

  describe('getResponsiveWidth', () => {
    it('deve calcular largura percentual corretamente', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 400, height: 800 }));
      const width = getResponsiveWidth(50);
      expect(width).toBe(200); // 400 * 50 / 100
    });
  });

  describe('getResponsiveHeight', () => {
    it('deve calcular altura percentual corretamente', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 400, height: 800 }));
      const height = getResponsiveHeight(50);
      expect(height).toBe(400); // 800 * 50 / 100
    });
  });

  describe('getResponsiveGap', () => {
    it('deve retornar gap reduzido para telas pequenas', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 320, height: 568 }));
      const gap = getResponsiveGap(8);
      expect(gap).toBe(6); // 8 * 0.75
    });
  });

  describe('getResponsiveBorderRadius', () => {
    it('deve retornar borderRadius reduzido para telas pequenas', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 320, height: 568 }));
      const borderRadius = getResponsiveBorderRadius(12);
      expect(borderRadius).toBe(10.2); // 12 * 0.85
    });
  });

  describe('getResponsiveColumns', () => {
    it('deve retornar menos colunas para telas pequenas', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 320, height: 568 }));
      const columns = getResponsiveColumns(2);
      expect(columns).toBe(1);
    });

    it('deve retornar mais colunas para telas muito grandes', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get = jest.fn(() => ({ width: 600, height: 800 }));
      const columns = getResponsiveColumns(2);
      expect(columns).toBe(3);
    });
  });
});

