import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import ForgottenItemsScreen from '../ForgottenItemsScreen';
import {
  getForgottenItems,
  createWearLog,
  getProfile,
  updateProfile,
} from '../../services/api';

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock navigation hooks
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

// Mock API
jest.mock('../../services/api', () => ({
  getForgottenItems: jest.fn(),
  createWearLog: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('ForgottenItemsScreen Component', () => {
  const mockForgottenItems = [
    {
      _id: 'c1',
      name: 'Winter Coat',
      brand: 'Uniqlo',
      category: 'outerwear',
      colors: ['Navy'],
      condition: 'Good',
      status: 'Available',
      analytics: {
        lastWornAt: '2026-06-01T00:00:00.000Z',
      },
    },
  ];

  const mockUserProfile = {
    preferences: {
      forgottenItemThresholdDays: 21,
    },
  };

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

  it('renders summary and forgotten items correctly', async () => {
    (getForgottenItems as jest.Mock).mockResolvedValue(mockForgottenItems);
    (getProfile as jest.Mock).mockResolvedValue(mockUserProfile);

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ForgottenItemsScreen navigation={mockNavigation} />,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('1 items forgotten'))).toBe(true);
    expect(texts.some(t => t.includes('Winter Coat'))).toBe(true);
    expect(texts.some(t => t.includes('Last worn: 2026-06-01'))).toBe(true);
  });

  it('opens detail modal on item tap and handles Log Wear successfully', async () => {
    (getForgottenItems as jest.Mock).mockResolvedValue(mockForgottenItems);
    (getProfile as jest.Mock).mockResolvedValue(mockUserProfile);
    (createWearLog as jest.Mock).mockResolvedValue({ _id: 'new-log-id' });

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ForgottenItemsScreen navigation={mockNavigation} />,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Find the item card and click it to open detail modal
    const itemCard = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Winter Coat',
        ).length > 0,
    );

    await act(async () => {
      itemCard.props.onPress();
    });

    // Check modal detail text is present
    const modalTitles = tree.root.findAll(
      (node: any) =>
        node.type === 'Text' && node.props.children === 'Winter Coat',
    );
    expect(modalTitles.length).toBeGreaterThan(0);

    // Verify detail options are there (Log Wear / Export/Donate)
    const logWearButton = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Log Wear',
        ).length > 0,
    );
    expect(logWearButton).toBeTruthy();

    // Trigger log wear button tap
    await act(async () => {
      logWearButton.props.onPress();
    });

    // Alert should prompt "Log wear today?" -> click OK (which calls createWearLog and refetches)
    expect(Alert.alert).toHaveBeenCalledWith(
      'Log Wear',
      'Log "Winter Coat" as worn today?',
      expect.any(Array),
    );

    const logWearConfirmButton = (
      Alert.alert as jest.Mock
    ).mock.calls[0][2].find((btn: any) => btn.text === 'Log Wear');

    // Call the confirm button callback
    await act(async () => {
      await logWearConfirmButton.onPress();
    });

    expect(createWearLog).toHaveBeenCalledWith(
      'mock-token',
      expect.objectContaining({
        clothingWorn: [{ itemId: 'c1' }],
      }),
    );
  });

  it('triggers Export/Donate from the detail modal', async () => {
    (getForgottenItems as jest.Mock).mockResolvedValue(mockForgottenItems);
    (getProfile as jest.Mock).mockResolvedValue(mockUserProfile);

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ForgottenItemsScreen navigation={mockNavigation} />,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Open detail modal
    const itemCard = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Winter Coat',
        ).length > 0,
    );
    await act(async () => {
      itemCard.props.onPress();
    });

    // Find Export/Donate button
    const exportButton = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Export/Donate',
        ).length > 0,
    );
    expect(exportButton).toBeTruthy();

    await act(async () => {
      exportButton.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Export', {
      item: mockForgottenItems[0],
    });
  });

  it('opens Settings modal, validates threshold >= 7 (BR12), and saves settings successfully', async () => {
    (getForgottenItems as jest.Mock).mockResolvedValue(mockForgottenItems);
    (getProfile as jest.Mock).mockResolvedValue(mockUserProfile);
    (updateProfile as jest.Mock).mockResolvedValue({});

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ForgottenItemsScreen navigation={mockNavigation} />,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Find Settings button (header settings icon has settings-outline inside)
    const settingsButton = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node
          .findAllByType('Icon')
          .some((icon: any) => icon.props.name === 'settings-outline'),
    );
    expect(settingsButton).toBeTruthy();

    // Open Settings Modal
    await act(async () => {
      settingsButton.props.onPress();
    });

    // Find input and submit buttons
    const textInput = tree.root.findByType('TextInput');
    const saveButton = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Save',
        ).length > 0,
    );

    // 1. Try to set threshold to 5 days (fails BR12)
    await act(async () => {
      textInput.props.onChangeText('5');
    });
    await act(async () => {
      saveButton.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Minimum threshold is 7 days (BR12)',
    );

    // 2. Set threshold to 30 days (success)
    await act(async () => {
      textInput.props.onChangeText('30');
    });
    await act(async () => {
      saveButton.props.onPress();
    });

    expect(updateProfile).toHaveBeenCalledWith('mock-token', {
      forgottenItemThresholdDays: 30,
    });
  });
});
