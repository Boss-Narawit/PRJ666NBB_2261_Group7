import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ItemDetailScreen, { fieldToPatch } from '../ItemDetailScreen';
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

// The reconciliation between the UI's display shape and the Clothing model's
// enums/field names — the part most likely to break a future edit silently.
describe('fieldToPatch reconciliation', () => {
  it('lowercases category to match the model enum', () => {
    expect(fieldToPatch('category', 'Outerwear')).toEqual({
      category: 'outerwear',
    });
  });

  it('maps a single color input onto the colors[] field', () => {
    expect(fieldToPatch('color', 'Navy')).toEqual({ colors: ['Navy'] });
  });

  it('splits a comma-separated color list onto the colors[] field', () => {
    expect(fieldToPatch('color', 'Navy, White , Red')).toEqual({
      colors: ['Navy', 'White', 'Red'],
    });
  });

  it('maps description onto notes', () => {
    expect(fieldToPatch('description', 'Summer piece')).toEqual({
      notes: 'Summer piece',
    });
  });

  it('passes through brand/size/condition unchanged', () => {
    expect(fieldToPatch('brand', 'Zara')).toEqual({ brand: 'Zara' });
    expect(fieldToPatch('size', 'M')).toEqual({ size: 'M' });
    expect(fieldToPatch('condition', 'Damaged')).toEqual({
      condition: 'Damaged',
    });
  });
});

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

  it('shows the exported banner and hides actions for an exported item', async () => {
    (getClothingById as jest.Mock).mockResolvedValue({
      _id: 'c1',
      name: 'Blue Jacket',
      brand: 'Levi',
      category: 'outerwear',
      colors: ['Blue'],
      size: 'M',
      imageUrl: 'http://example.com/j.jpg',
      condition: 'Good',
      status: 'Exported',
      exportInfo: {
        partnerName: 'Depop',
        type: 'resale',
        exportedAt: '2026-06-30T00:00:00.000Z',
      },
      analytics: { wearCount: 2 },
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

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Exported'))).toBe(true);
    expect(texts.some(t => t.includes('Depop'))).toBe(true);
    // Read-only: the Log Wear action is not rendered for an exported item.
    expect(texts.some(t => t.includes('Log Wear'))).toBe(false);
  });

  it('shows the archived banner and hides actions for an archived item', async () => {
    (getClothingById as jest.Mock).mockResolvedValue({
      _id: 'c1',
      name: 'Old Sweater',
      brand: 'Gap',
      category: 'tops',
      colors: ['Grey'],
      size: 'L',
      imageUrl: 'http://example.com/s.jpg',
      condition: 'Fair',
      status: 'Archived',
      analytics: { wearCount: 5 },
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

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Archived'))).toBe(true);
    expect(texts.some(t => t.includes('Old Sweater'))).toBe(true);
    // Read-only: an archived item (left the wardrobe pre-Exported-status)
    // hides the same actions an exported item does.
    expect(texts.some(t => t.includes('Log Wear'))).toBe(false);
    expect(texts.some(t => t.includes('Export/Donate'))).toBe(false);
  });
});
