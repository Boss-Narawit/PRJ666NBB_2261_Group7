import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import ThoughtfulPurchasingScreen from '../ThoughtfulPurchasingScreen';
import {
  checkSimilarity,
  createPurchase,
  uploadClothingImage,
} from '../../services/api';
import { launchImageLibrary } from 'react-native-image-picker';

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock components
jest.mock('../../components/CustomDatePicker', () => 'CustomDatePicker');

// Mock Auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
  }),
}));

// Mock Image Picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock API
jest.mock('../../services/api', () => ({
  checkSimilarity: jest.fn(),
  createPurchase: jest.fn(),
  uploadClothingImage: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('ThoughtfulPurchasingScreen Component', () => {
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

  it('renders all form sections correctly', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    const texts = textValues(tree);
    expect(texts.some(t => t.includes('Upload Image'))).toBe(true);
    expect(texts.some(t => t.includes('Item Name'))).toBe(true);
    expect(texts.some(t => t.includes('Start Date'))).toBe(true);
    expect(texts.some(t => t.includes('End Date'))).toBe(true);
    expect(texts.some(t => t.includes('AI Similarity Check'))).toBe(true);
    expect(texts.some(t => t.includes('Start Timer'))).toBe(true);
  });

  it('triggers photo selection successfully', async () => {
    (launchImageLibrary as jest.Mock).mockImplementation(
      (options, callback) => {
        callback({ assets: [{ uri: 'file://mock-photo.jpg' }] });
      },
    );

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    // Find photo upload container
    const uploadBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'Tap to upload image',
        ).length > 0,
    );
    expect(uploadBtn).toBeTruthy();

    await act(async () => {
      uploadBtn.props.onPress();
    });

    expect(launchImageLibrary).toHaveBeenCalled();

    // Verify Image renders instead of placeholder text
    const images = tree.root.findAllByType('Image');
    expect(images.length).toBe(1);
    expect(images[0].props.source.uri).toBe('file://mock-photo.jpg');
  });

  it('alerts if checking similarity without a photo', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    const similarityBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'AI Similarity Check',
        ).length > 0,
    );

    await act(async () => {
      similarityBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please upload an image first',
    );
  });

  it('runs similarity check and handles starting timer from modal', async () => {
    (launchImageLibrary as jest.Mock).mockImplementation(
      (options, callback) => {
        callback({ assets: [{ uri: 'file://mock-photo.jpg' }] });
      },
    );
    // Cosine 0.8 → the 80% "very similar" branch.
    (checkSimilarity as jest.Mock).mockResolvedValue({
      id: 'clothing-1',
      name: 'Denim Jacket',
      imageUrl: 'http://cloudinary.com/denim.jpg',
      score: 0.8,
    });
    (uploadClothingImage as jest.Mock).mockResolvedValue(
      'http://cloudinary.com/uploaded.jpg',
    );
    (createPurchase as jest.Mock).mockResolvedValue({ _id: 'purchase-id' });

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    // Upload photo first
    const uploadBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'Tap to upload image',
        ).length > 0,
    );
    await act(async () => {
      uploadBtn.props.onPress();
    });

    // Enter item name
    const textInput = tree.root.findByType('TextInput');
    await act(async () => {
      textInput.props.onChangeText('Cool Jacket');
    });

    // Tap AI Similarity Check
    const similarityBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'AI Similarity Check',
        ).length > 0,
    );
    await act(async () => {
      similarityBtn.props.onPress();
    });

    // The real endpoint was called and the cosine percentage renders,
    // alongside the matched item's name.
    expect(checkSimilarity).toHaveBeenCalledWith('mock-token', {
      uri: 'file://mock-photo.jpg',
    });
    const modalTexts = textValues(tree);
    expect(modalTexts.some(t => t.includes('80%'))).toBe(true);
    expect(modalTexts.some(t => t.includes('Denim Jacket'))).toBe(true);

    // Find the Text node with 'Start Timer' that has a 'Modal' ancestor
    const startTimerTextNodes = tree.root.findAll(
      (node: any) =>
        node.type === 'Text' && node.props.children === 'Start Timer',
    );
    const modalTextNode = startTimerTextNodes.find((node: any) => {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'Modal') return true;
        parent = parent.parent;
      }
      return false;
    });

    expect(modalTextNode).toBeTruthy();

    let modalStartTimerBtn = modalTextNode;
    while (modalStartTimerBtn && !modalStartTimerBtn.props.onPress) {
      modalStartTimerBtn = modalStartTimerBtn.parent;
    }

    expect(modalStartTimerBtn).toBeTruthy();

    await act(async () => {
      modalStartTimerBtn.props.onPress();
    });

    expect(uploadClothingImage).toHaveBeenCalledWith('mock-token', {
      uri: 'file://mock-photo.jpg',
    });
    expect(createPurchase).toHaveBeenCalledWith(
      'mock-token',
      expect.objectContaining({
        itemName: 'Cool Jacket',
        imageUrl: 'http://cloudinary.com/uploaded.jpg',
        cooldownMinutes: 1440, // 24 hours (default tomorrow)
      }),
    );

    // Successful purchase alert calls navigate('Cart')
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cooling-off Timer Started',
      expect.stringContaining('Your cooling-off period runs until'),
      expect.any(Array),
    );

    const alertOkBtn = (Alert.alert as jest.Mock).mock.calls[0][2].find(
      (btn: any) => btn.text === 'OK',
    );
    await act(async () => {
      alertOkBtn.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Cart');
  });

  it('shows the no-match result when the wardrobe has nothing to compare', async () => {
    (launchImageLibrary as jest.Mock).mockImplementation(
      (options, callback) => {
        callback({ assets: [{ uri: 'file://mock-photo.jpg' }] });
      },
    );
    (checkSimilarity as jest.Mock).mockResolvedValue(null);

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    const uploadBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'Tap to upload image',
        ).length > 0,
    );
    await act(async () => {
      uploadBtn.props.onPress();
    });

    const similarityBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'AI Similarity Check',
        ).length > 0,
    );
    await act(async () => {
      similarityBtn.props.onPress();
    });

    const modalTexts = textValues(tree);
    expect(modalTexts.some(t => t.includes('No similar items found'))).toBe(
      true,
    );
    expect(modalTexts.some(t => t.includes('0%'))).toBe(false);
  });

  it('hides the percentage for a below-floor match to avoid confusing the user', async () => {
    (launchImageLibrary as jest.Mock).mockImplementation(
      (options, callback) => {
        callback({ assets: [{ uri: 'file://mock-photo.jpg' }] });
      },
    );
    // Cosine 0.44 is below the 50% display floor: the closest item is unrelated
    // (CLIP's baseline for arbitrary images), so no percentage/thumbnail shows.
    (checkSimilarity as jest.Mock).mockResolvedValue({
      id: 'clothing-1',
      name: 'Wool Scarf',
      imageUrl: 'http://cloudinary.com/scarf.jpg',
      score: 0.44,
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    const uploadBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'Tap to upload image',
        ).length > 0,
    );
    await act(async () => {
      uploadBtn.props.onPress();
    });

    const similarityBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'AI Similarity Check',
        ).length > 0,
    );
    await act(async () => {
      similarityBtn.props.onPress();
    });

    const modalTexts = textValues(tree);
    expect(modalTexts.some(t => t.includes('No close match found'))).toBe(true);
    // No percentage and no matched-item name leak through below the floor.
    expect(modalTexts.some(t => t.includes('44%'))).toBe(false);
    expect(modalTexts.some(t => t.includes('Wool Scarf'))).toBe(false);
  });

  it('surfaces an error instead of a fake score when the check fails', async () => {
    (launchImageLibrary as jest.Mock).mockImplementation(
      (options, callback) => {
        callback({ assets: [{ uri: 'file://mock-photo.jpg' }] });
      },
    );
    (checkSimilarity as jest.Mock).mockRejectedValue(
      new Error('AI service unavailable'),
    );

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    const uploadBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'Tap to upload image',
        ).length > 0,
    );
    await act(async () => {
      uploadBtn.props.onPress();
    });

    const similarityBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'AI Similarity Check',
        ).length > 0,
    );
    await act(async () => {
      similarityBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Similarity Check Failed',
      'AI service unavailable',
    );

    const allTexts = textValues(tree);
    expect(allTexts.some(t => t.includes('similar to'))).toBe(false);
  });

  it('validates cooldownMinutes >= 24h (BR14)', async () => {
    (launchImageLibrary as jest.Mock).mockImplementation(
      (options, callback) => {
        callback({ assets: [{ uri: 'file://mock-photo.jpg' }] });
      },
    );

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThoughtfulPurchasingScreen navigation={mockNavigation} />,
      );
    });

    // Upload photo
    const uploadBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) =>
            n.type === 'Text' && n.props.children === 'Tap to upload image',
        ).length > 0,
    );
    await act(async () => {
      uploadBtn.props.onPress();
    });

    // Enter name
    const textInput = tree.root.findByType('TextInput');
    await act(async () => {
      textInput.props.onChangeText('Cool Jacket');
    });

    // Directly update endDate state to today (0 hours difference) to trigger BR14 error
    const datePicker = tree.root.findByType('CustomDatePicker' as any);
    await act(async () => {
      datePicker.props.onConfirm(new Date()); // same day
    });

    // Tap Start Timer button
    const startTimerBtn = tree.root.find(
      (node: any) =>
        node.props.onPress &&
        node.findAll(
          (n: any) => n.type === 'Text' && n.props.children === 'Start Timer',
        ).length > 0,
    );
    await act(async () => {
      startTimerBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'The cooling-off period must be at least 24 hours.',
    );
  });
});
