import '@testing-library/jest-native/extend-expect';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock do expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children, ...props }: any) => children,
  Tabs: {
    Screen: ({ children }: any) => children,
  },
}));

// Mock do expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock do Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Dimensions.get = jest.fn(() => ({
    width: 375,
    height: 812,
  }));
  return RN;
});

// Mock global fetch
global.fetch = jest.fn();

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

