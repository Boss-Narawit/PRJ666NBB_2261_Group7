import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ItemDetailScreen from '../ItemDetailScreen';
import { getClothingById } from '../../services/api';

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
  getClothingById: jest.fn(),
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

const route = { params: { itemId: 'c1' } };

describe('ItemDetailScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator initially', async () => {
    (getClothingById as jest.Mock).mockReturnValue(new Promise(() => {}));

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ItemDetailScreen navigation={mockNavigation} route={route} />,
      );
    });

    expect(tree.root.findByType('ActivityIndicator')).toBeTruthy();
  });

  it('renders the fetched item by id', async () => {
    (getClothingById as jest.Mock).mockResolvedValue({
      _id: 'c1',
      name: 'Red Dress',
      brand: 'Zara',
      category: 'dresses',
      colors: ['Red'],
      size: 'S',
      imageUrl: 'http://example.com/d.jpg',
      condition: 'Good',
      status: 'Available',
      notes: 'Summer piece',
      analytics: { wearCount: 4, lastWornAt: '2026-06-01T00:00:00.000Z' },
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ItemDetailScreen navigation={mockNavigation} route={route} />,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(getClothingById).toHaveBeenCalledWith('mock-token', 'c1');
    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Red Dress'))).toBe(true);
    expect(texts.some(t => t.includes('Zara'))).toBe(true);
    expect(texts.some(t => t.includes('Summer piece'))).toBe(true);
    expect(texts.some(t => t.includes('4'))).toBe(true); // wear count
  });

  it('shows an error state when the fetch fails', async () => {
    (getClothingById as jest.Mock).mockRejectedValue(
      new Error('Clothing item not found'),
    );

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ItemDetailScreen navigation={mockNavigation} route={route} />,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Clothing item not found'))).toBe(true);
    expect(texts.some(t => t.includes('Go Back'))).toBe(true);
  });
});
