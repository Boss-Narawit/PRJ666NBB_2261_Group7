import React from 'react';
import renderer, { act } from 'react-test-renderer';
import LogOutfitScreen from '../LogOutfitScreen';
import { getClothing } from '../../services/api';

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock the calendar date picker — react-native-calendars ships untranspiled ESM
// that Jest's RN preset won't transform, so importing it for real crashes the
// suite at load time (same reason the ThoughtfulPurchasing test mocks it).
jest.mock('../../components/CustomDatePicker', () => 'CustomDatePicker');

// Mock Auth Context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
  }),
}));

// Mock API calls
jest.mock('../../services/api', () => ({
  getClothing: jest.fn(),
  createWearLog: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

function textValues(tree: any): string[] {
  return tree.root.findAllByType('Text').map((el: any) => {
    const children = el.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

describe('LogOutfitScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator initially', async () => {
    (getClothing as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    let tree: any;
    await act(async () => {
      tree = renderer.create(<LogOutfitScreen navigation={mockNavigation} />);
    });

    expect(tree.root.findByType('ActivityIndicator')).toBeTruthy();
  });

  it('renders only Available wardrobe items in the picker', async () => {
    (getClothing as jest.Mock).mockResolvedValue([
      {
        _id: 'c1',
        name: 'Blue Shirt',
        brand: 'Uniqlo',
        category: 'tops',
        colors: ['Blue'],
        size: 'M',
        imageUrl: 'http://example.com/s.jpg',
        condition: 'Good',
        status: 'Available',
      },
      {
        _id: 'c2',
        name: 'Old Jacket',
        brand: 'Zara',
        category: 'outerwear',
        colors: ['Black'],
        size: 'L',
        imageUrl: 'http://example.com/j.jpg',
        condition: 'Fair',
        status: 'Archived',
      },
    ]);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<LogOutfitScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Log Outfit'))).toBe(true);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(true);
    // Archived item is excluded from the picker.
    expect(texts.some(t => t.includes('Old Jacket'))).toBe(false);
  });
});
