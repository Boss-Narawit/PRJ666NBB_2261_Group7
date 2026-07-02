import React from 'react';
import renderer, { act } from 'react-test-renderer';
import WearHistoryScreen from '../WearHistoryScreen';
import { getWearLogs } from '../../services/api';

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
  getWearLogs: jest.fn(),
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

describe('WearHistoryScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator initially', async () => {
    (getWearLogs as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WearHistoryScreen navigation={mockNavigation} />);
    });

    expect(tree.root.findByType('ActivityIndicator')).toBeTruthy();
  });

  it('renders the outfit name as the title with the date beneath it', async () => {
    (getWearLogs as jest.Mock).mockResolvedValue({
      wearLogs: [
        {
          _id: 'log1',
          logDate: '2026-06-15T00:00:00.000Z',
          outfitName: 'Weekend Look',
          clothingWorn: [
            {
              _id: 'cw1',
              itemId: {
                _id: 'c1',
                name: 'Blue Shirt',
                brand: 'Uniqlo',
                category: 'tops',
                imageUrl: 'http://example.com/s.jpg',
                analytics: { wearCount: 7 },
              },
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WearHistoryScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    // Named outfit: the name is the title, and the date still renders as a subline.
    expect(texts.some(t => t.includes('Weekend Look'))).toBe(true);
    expect(texts.some(t => t.includes('2026-06-15'))).toBe(true);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(true);
  });

  it('falls back to the date as the title when there is no outfit name', async () => {
    (getWearLogs as jest.Mock).mockResolvedValue({
      wearLogs: [
        {
          _id: 'log2',
          logDate: '2026-06-10T00:00:00.000Z',
          clothingWorn: [
            {
              _id: 'cw2',
              itemId: {
                _id: 'c2',
                name: 'Black Jeans',
                brand: 'Levis',
                category: 'bottoms',
                imageUrl: 'http://example.com/j.jpg',
                analytics: { wearCount: 3 },
              },
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WearHistoryScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('2026-06-10'))).toBe(true);
    expect(texts.some(t => t.includes('Black Jeans'))).toBe(true);
  });

  it('shows empty state when no logs returned', async () => {
    (getWearLogs as jest.Mock).mockResolvedValue({
      wearLogs: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<WearHistoryScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('No wear logs yet'))).toBe(true);
  });
});
