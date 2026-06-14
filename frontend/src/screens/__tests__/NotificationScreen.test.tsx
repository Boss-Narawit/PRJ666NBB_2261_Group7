import React from 'react';
import renderer, { act } from 'react-test-renderer';
import NotificationScreen from '../NotificationScreen';
import { getNotifications, markNotificationRead } from '../../services/api';

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

// Mock API calls
jest.mock('../../services/api', () => ({
  getNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
}));

describe('NotificationScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (getNotifications as jest.Mock).mockReturnValue(new Promise(() => {}));

    let tree;
    await act(async () => {
      tree = renderer.create(<NotificationScreen />);
    });

    const loadingIndicator = tree.root.findByType('ActivityIndicator');
    expect(loadingIndicator).toBeTruthy();
  });

  it('renders notifications list when loaded', async () => {
    const mockNotifications = {
      notifications: [
        {
          _id: 'n1',
          type: 'forgotten_item',
          message: 'You have forgotten to wear your Winter Jacket',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'n2',
          type: 'recap_ready',
          message: 'Your Style Recap is ready!',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
        },
      ],
      page: 1,
      total: 2,
    };

    (getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    let tree;
    await act(async () => {
      tree = renderer.create(<NotificationScreen />);
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

    // Check header
    expect(textValues.some(text => text.includes('Notifications'))).toBe(true);

    // Check notification messages are rendered
    expect(
      textValues.some(text =>
        text.includes('You have forgotten to wear your Winter Jacket'),
      ),
    ).toBe(true);
    expect(
      textValues.some(text => text.includes('Your Style Recap is ready!')),
    ).toBe(true);
  });

  it('marks unread notification as read on press', async () => {
    const mockNotifications = {
      notifications: [
        {
          _id: 'n1',
          type: 'forgotten_item',
          message: 'Unread Alert',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      page: 1,
      total: 1,
    };

    (getNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (markNotificationRead as jest.Mock).mockResolvedValue({});

    let tree;
    await act(async () => {
      tree = renderer.create(<NotificationScreen />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const touchableCards = tree.root.findAll(
      (node: any) => typeof node.props.onPress === 'function',
    );

    const card = touchableCards.find((c: any) => {
      const texts = c.findAllByType('Text');
      return texts.some((t: any) => {
        const val = t.props.children;
        return typeof val === 'string' && val.includes('Unread Alert');
      });
    });

    expect(card).toBeTruthy();

    // Trigger press
    await act(async () => {
      card.props.onPress();
    });

    // Verify API called with token and notification id
    expect(markNotificationRead).toHaveBeenCalledWith('mock-token', 'n1');
  });
});
