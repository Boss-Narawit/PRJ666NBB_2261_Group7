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

  it('filters clothing items by search query (name or brand)', async () => {
    // Mock 6 items, making 'Blue Shirt' the oldest so it is not in the 5 recentItems
    (getClothing as jest.Mock).mockResolvedValue([
      {
        _id: 'c1',
        name: 'Blue Shirt',
        brand: 'Uniqlo',
        category: 'tops',
        status: 'Available',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'c2',
        name: 'Red Dress',
        brand: 'Zara',
        category: 'dresses',
        status: 'Available',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      {
        _id: 'c3',
        name: 'Black Pants',
        brand: 'Zara',
        category: 'bottoms',
        status: 'Available',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      {
        _id: 'c4',
        name: 'Green Jacket',
        brand: 'Zara',
        category: 'outerwear',
        status: 'Available',
        createdAt: '2026-04-01T00:00:00.000Z',
      },
      {
        _id: 'c5',
        name: 'White Socks',
        brand: 'Zara',
        category: 'accessories',
        status: 'Available',
        createdAt: '2026-05-01T00:00:00.000Z',
      },
      {
        _id: 'c6',
        name: 'Yellow Shoes',
        brand: 'Zara',
        category: 'shoes',
        status: 'Available',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ]);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WardrobeScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Check both are rendered initially
    let texts = textValues(tree);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(true);
    expect(texts.some(t => t.includes('Red Dress'))).toBe(true);

    // Find Search TextInput and update text to 'Zara'
    const searchInput = tree.root.findByType('TextInput');
    await act(async () => {
      searchInput.props.onChangeText('Zara');
    });

    // Now only Red Dress should be visible; Blue Shirt (Uniqlo, oldest) should be gone
    texts = textValues(tree);
    expect(texts.some(t => t.includes('Red Dress'))).toBe(true);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(false);
  });

  it('filters clothing items by category', async () => {
    // Mock 6 items, making 'Blue Shirt' the oldest so it is not in the 5 recentItems
    (getClothing as jest.Mock).mockResolvedValue([
      {
        _id: 'c1',
        name: 'Blue Shirt',
        brand: 'Uniqlo',
        category: 'tops',
        status: 'Available',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'c2',
        name: 'Red Dress',
        brand: 'Zara',
        category: 'dresses',
        status: 'Available',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      {
        _id: 'c3',
        name: 'Black Pants',
        brand: 'Zara',
        category: 'bottoms',
        status: 'Available',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      {
        _id: 'c4',
        name: 'Green Jacket',
        brand: 'Zara',
        category: 'outerwear',
        status: 'Available',
        createdAt: '2026-04-01T00:00:00.000Z',
      },
      {
        _id: 'c5',
        name: 'White Socks',
        brand: 'Zara',
        category: 'accessories',
        status: 'Available',
        createdAt: '2026-05-01T00:00:00.000Z',
      },
      {
        _id: 'c6',
        name: 'Yellow Shoes',
        brand: 'Zara',
        category: 'shoes',
        status: 'Available',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ]);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WardrobeScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Initially both render
    let texts = textValues(tree);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(true);
    expect(texts.some(t => t.includes('Red Dress'))).toBe(true);

    // Find the category chip containing text 'Dresses' by checking for onPress prop
    const dressesChip = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Dresses',
        ).length > 0,
    );
    expect(dressesChip).toBeTruthy();

    // Tap "Dresses"
    await act(async () => {
      dressesChip.props.onPress();
    });

    // Now only Red Dress should be visible; Blue Shirt (tops, oldest) should be gone
    texts = textValues(tree);
    expect(texts.some(t => t.includes('Red Dress'))).toBe(true);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(false);
  });

  it('toggles layout view mode between grid and list', async () => {
    (getClothing as jest.Mock).mockResolvedValue([
      {
        _id: 'c1',
        name: 'Blue Shirt',
        brand: 'Uniqlo',
        category: 'tops',
        colors: ['Blue'],
        imageUrl: 'http://example.com/shirt.jpg',
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

    // In grid mode, the details line (category • color • wearCount) is NOT rendered
    let texts = textValues(tree);
    expect(texts.some(t => t.includes('tops • Blue • Worn 7 times'))).toBe(
      false,
    );

    // Find toggle view mode button (element with onPress containing the list/grid Icon)
    const toggleButton = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node
          .findAllByType('Icon')
          .some(
            (icon: any) =>
              icon.props.name === 'list-outline' ||
              icon.props.name === 'grid-outline',
          ),
    );

    expect(toggleButton).toBeTruthy();

    // Toggle to list view
    await act(async () => {
      toggleButton.props.onPress();
    });

    // Now in list mode, the details line (category • color • wearCount) should be rendered
    texts = textValues(tree);
    expect(texts.some(t => t.includes('tops • Blue • Worn 7 times'))).toBe(
      true,
    );
  });
});
