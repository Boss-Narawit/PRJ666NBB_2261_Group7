import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import ExportScreen from '../ExportScreen';
import { getClothing, listPartners } from '../../services/api';

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// ExportScreen refetches its wardrobe on focus via useFocusEffect. Without a real
// NavigationContainer the hook can't register focus listeners, so mock it to run
// the callback once on mount — mirroring the mount-time fetch these tests assert.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require('react');
    useEffect(() => cb(), [cb]);
  },
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock Auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
  }),
}));

// Mock API
jest.mock('../../services/api', () => ({
  getClothing: jest.fn(),
  listPartners: jest.fn(),
}));

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('ExportScreen Component', () => {
  const mockClothing = [
    {
      _id: 'c1',
      name: 'Blue Shirt',
      brand: 'Uniqlo',
      category: 'tops',
      status: 'Available',
    },
    {
      _id: 'c2',
      name: 'Red Dress',
      brand: 'Zara',
      category: 'dresses',
      status: 'Available',
    },
  ];

  const mockResalePartners = [
    { _id: 'p1', name: 'Vestiaire Collective', type: 'resale', isActive: true },
  ];

  const mockDonationPartners = [
    { _id: 'p2', name: 'Red Cross', type: 'donation', isActive: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const textValues = (tree: any) => {
    return tree.root.findAllByType('Text').map((el: any) => {
      const children = el.props.children;
      return Array.isArray(children)
        ? children.join('')
        : String(children || '');
    });
  };

  it('renders items and resale partners by default', async () => {
    (getClothing as jest.Mock).mockResolvedValue(mockClothing);
    (listPartners as jest.Mock).mockResolvedValue(mockResalePartners);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<ExportScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Blue Shirt'))).toBe(true);
    expect(texts.some(t => t.includes('Vestiaire Collective'))).toBe(true);
  });

  it('refreshes partners when switching tabs', async () => {
    (getClothing as jest.Mock).mockResolvedValue(mockClothing);
    (listPartners as jest.Mock)
      .mockResolvedValueOnce(mockResalePartners)
      .mockResolvedValueOnce(mockDonationPartners);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<ExportScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Check resale partner shows up
    let texts = textValues(tree);
    expect(texts.some(t => t.includes('Vestiaire Collective'))).toBe(true);

    // Switch to Donation tab
    const donationTab = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Donation',
        ).length > 0,
    );

    await act(async () => {
      donationTab.props.onPress();
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Verify listPartners was called with 'donation'
    expect(listPartners).toHaveBeenLastCalledWith('mock-token', 'donation');

    // Check donation partner shows up now
    texts = textValues(tree);
    expect(texts.some(t => t.includes('Red Cross'))).toBe(true);
  });

  it('selects item and partner and navigates to QualityChecklist', async () => {
    (getClothing as jest.Mock).mockResolvedValue(mockClothing);
    (listPartners as jest.Mock).mockResolvedValue(mockResalePartners);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<ExportScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Tap first item "Blue Shirt"
    const blueShirtCard = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Blue Shirt',
        ).length > 0,
    );
    await act(async () => {
      blueShirtCard.props.onPress();
    });

    // Tap partner "Vestiaire Collective"
    const partnerCard = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'Vestiaire Collective',
        ).length > 0,
    );
    await act(async () => {
      partnerCard.props.onPress();
    });

    // Tap "Next" button
    const nextButton = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Next',
        ).length > 0,
    );
    await act(async () => {
      nextButton.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('QualityChecklist', {
      items: ['c1'],
      type: 'resale',
      destination: 'p1',
    });
  });

  it('validates selection before navigation', async () => {
    (getClothing as jest.Mock).mockResolvedValue(mockClothing);
    (listPartners as jest.Mock).mockResolvedValue(mockResalePartners);

    let tree: any;
    await act(async () => {
      tree = renderer.create(<ExportScreen navigation={mockNavigation} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Tap "Next" button immediately without item or partner selection
    const nextButton = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Next',
        ).length > 0,
    );
    await act(async () => {
      nextButton.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please select at least one item',
    );
  });
});
