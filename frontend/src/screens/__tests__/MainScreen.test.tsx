import React from 'react';
import renderer, { act } from 'react-test-renderer';
import MainScreen from '../MainScreen';
import { getDashboardSummary } from '../../services/api';

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock navigation hooks
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => {
    // Run the callback immediately for testing
    require('react').useEffect(() => {
      callback();
    }, [callback]);
  },
}));

// Mock Auth Context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
  }),
}));

// Mock API calls
jest.mock('../../services/api', () => ({
  getDashboardSummary: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
};

describe('MainScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator initially', async () => {
    (getDashboardSummary as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves to keep loading state

    let tree;
    await act(async () => {
      tree = renderer.create(<MainScreen navigation={mockNavigation} />);
    });

    const loadingIndicator = tree.root.findByType('ActivityIndicator');
    expect(loadingIndicator).toBeTruthy();
  });

  it('renders dashboard summary data when loaded', async () => {
    const mockSummary = {
      userName: 'Alice',
      totalItems: 12,
      wornThisMonth: 6,
      forgottenCount: 2,
      forgottenItems: [
        {
          _id: 'item1',
          name: 'Floral Dress',
          brand: 'Zara',
          analytics: { lastWornAt: '2026-05-15T00:00:00.000Z' },
        },
      ],
    };

    (getDashboardSummary as jest.Mock).mockResolvedValue(mockSummary);

    let tree;
    await act(async () => {
      tree = renderer.create(<MainScreen navigation={mockNavigation} />);
    });

    // Wait for state updates
    await act(async () => {
      await Promise.resolve();
    });

    const textElements = tree.root.findAllByType('Text');
    const textValues = textElements.map((el: any) => {
      const children = el.props.children;
      return Array.isArray(children)
        ? children.join('')
        : String(children || '');
    });

    // Check userName renders
    expect(textValues.some(text => text.includes('Hello, Alice'))).toBe(true);

    // Check stats render
    expect(textValues.some(text => text.includes('12'))).toBe(true); // totalItems
    expect(textValues.some(text => text.includes('6'))).toBe(true); // wornThisMonth
    expect(textValues.some(text => text.includes('2'))).toBe(true); // forgottenCount

    // Check forgotten item details render
    expect(textValues.some(text => text.includes('Floral Dress'))).toBe(true);
    expect(textValues.some(text => text.includes('Zara'))).toBe(true);
  });
});
