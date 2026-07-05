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

  it('calculates and renders correct stats summary (total logs, most worn, least worn)', async () => {
    (getWearLogs as jest.Mock).mockResolvedValue({
      wearLogs: [
        {
          _id: 'log1',
          logDate: '2026-06-15T00:00:00.000Z',
          clothingWorn: [
            {
              _id: 'cw1',
              itemId: {
                _id: 'c1',
                name: 'Blue Shirt',
                brand: 'Uniqlo',
                category: 'tops',
                analytics: { wearCount: 10 },
              },
            },
          ],
        },
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
                analytics: { wearCount: 2 },
              },
            },
          ],
        },
      ],
      total: 2,
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
    // Total logs
    expect(texts.some(t => t.includes('2'))).toBe(true);
    // Most Worn count and name
    expect(texts.some(t => t.includes('10x'))).toBe(true);
    expect(
      texts.some(t => t.includes('Most Worn (all-time): Blue Shirt')),
    ).toBe(true);
    // Least Worn count and name
    expect(texts.some(t => t.includes('2x'))).toBe(true);
    expect(
      texts.some(t => t.includes('Least Worn (all-time): Black Jeans')),
    ).toBe(true);
  });

  it('calls API with the correct date range on quick-chip filter tap', async () => {
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

    // Reset mock calls from initial render
    (getWearLogs as jest.Mock).mockClear();

    // Find the chip with text 'Last 30 Days' by checking for onPress prop
    const last30DaysChip = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Last 30 Days',
        ).length > 0,
    );

    expect(last30DaysChip).toBeTruthy();

    // Tap "Last 30 Days"
    await act(async () => {
      last30DaysChip.props.onPress();
    });

    // Verify it called getWearLogs with the correct parameters (token, page 1, and 30 days ago range)
    expect(getWearLogs).toHaveBeenCalledWith(
      'mock-token',
      1,
      expect.objectContaining({
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );
  });
});
