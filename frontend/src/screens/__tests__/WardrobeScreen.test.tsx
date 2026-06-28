import React from 'react';
import renderer, { act } from 'react-test-renderer';
import WardrobeScreen from '../WardrobeScreen';
import { getClothing } from '../../services/api';

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock navigation hooks — run focus callback immediately
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => {
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
  getClothing: jest.fn(),
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

describe('WardrobeScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator initially', async () => {
    (getClothing as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WardrobeScreen navigation={mockNavigation} />);
    });

    expect(tree.root.findByType('ActivityIndicator')).toBeTruthy();
  });

  it('renders fetched clothing items when loaded', async () => {
    (getClothing as jest.Mock).mockResolvedValue([
      {
        _id: 'c1',
        name: 'Blue Shirt',
        brand: 'Uniqlo',
        category: 'tops',
        colors: ['Blue'],
        size: 'M',
        imageUrl: 'http://example.com/shirt.jpg',
        condition: 'Good',
        status: 'Available',
        analytics: { wearCount: 7 },
      },
    ]);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WardrobeScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(true);
    expect(texts.some(t => t.includes('Uniqlo'))).toBe(true);
    expect(texts.some(t => t.includes('Worn 7 times'))).toBe(true);
  });

  it('shows empty state when no items returned', async () => {
    (getClothing as jest.Mock).mockResolvedValue([]);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WardrobeScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('No items found'))).toBe(true);
  });
});
