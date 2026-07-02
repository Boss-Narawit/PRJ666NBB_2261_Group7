import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { uploadClothingImage, createClothing } from '../services/api';
import { getSizeOptions } from '../constants/categories';

type Props = {
  navigation: any;
  route?: any;
};

export default function AddClothScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  // Prefill carried over from an approved Thoughtful Purchase ("Buy it").
  const prefill = route?.params?.prefill;
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<Asset | null>(null);
  // A hosted image URL from the prefill — already on Cloudinary, so it skips the
  // upload step in handleSave (the picker yields a local Asset instead).
  const [prefillImageUrl] = useState<string | null>(prefill?.imageUrl ?? null);

  // Form fields
  const [name, setName] = useState(prefill?.name ?? '');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState(prefill?.notes ?? '');

  const categories = [
    'Tops',
    'Bottoms',
    'Dresses',
    'Outerwear',
    'Shoes',
    'Accessories',
    'Activewear',
  ];

  // Size suggestions depend on the chosen category (alpha for tops, waist for
  // pants, numeric for shoes). These are quick-fill chips only — `size` is a
  // free-text field, so any printed label (e.g. "32x34", "EU 42", "8") can be
  // entered even when it isn't one of the suggestions.
  const sizes = getSizeOptions(category);

  const selectPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      response => {
        if (response.assets && response.assets[0]?.uri) {
          setPhoto(response.assets[0]);
        } else if (response.didCancel) {
          // user cancelled the picker — no action needed
        } else {
          Alert.alert('Error', 'Failed to select photo');
        }
      },
    );
  };

  const handleSave = async () => {
    // Validation (BR4 - required fields). Validate the *trimmed/parsed* values —
    // whitespace-only text or a comma-only color would pass a truthiness check,
    // upload the photo, then fail server validation (orphaning the Cloudinary
    // asset on every retry). A prefilled hosted image satisfies the photo
    // requirement without picking a new one.
    const hasColor = color
      .split(',')
      .map(c => c.trim())
      .some(Boolean);
    if (
      !name.trim() ||
      !brand.trim() ||
      !category ||
      !hasColor ||
      !size ||
      (!photo?.uri && !prefillImageUrl)
    ) {
      Alert.alert(
        'Error',
        'Please fill all required fields (Name, Brand, Category, Color, Size, and Photo)',
      );
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      // A newly picked photo is uploaded to Cloudinary; a prefilled image is
      // already hosted, so reuse its URL. The wardrobe renders a blank frame for
      // non-URL imageUrls, so both paths must yield an absolute URL.
      const imageUrl = photo?.uri
        ? await uploadClothingImage(token, photo)
        : prefillImageUrl!;
      await createClothing(token, {
        name,
        brand,
        category,
        color,
        size,
        imageUrl,
        notes: description,
      });

      Alert.alert('Success', 'Clothing item added!', [
        {
          text: 'OK',
          // The back button is locked while saving, but an iOS swipe-back can
          // still pop this screen mid-save — don't goBack from a stale screen.
          onPress: () => {
            if (navigation.isFocused()) navigation.goBack();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save clothing item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        {/* Backing out mid-save would let the success alert's goBack pop
            whatever screen is on top by then — lock it while saving. */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={loading}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wardrobe</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Add New Cloth Button */}
      <TouchableOpacity style={styles.addButton} onPress={selectPhoto}>
        <Icon name="camera-outline" size={24} color={colors.white} />
        <Text style={styles.addButtonText}>Add New Cloth</Text>
      </TouchableOpacity>

      {/* Photo Preview — picked photo takes precedence over a prefilled image */}
      {(photo || prefillImageUrl) && (
        <View style={styles.photoPreview}>
          <Image
            source={{ uri: photo?.uri ?? prefillImageUrl! }}
            style={styles.previewImage}
          />
          {photo && (
            <TouchableOpacity
              style={styles.removePhoto}
              onPress={() => setPhoto(null)}
            >
              <Icon name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Select Photo Button */}
      <TouchableOpacity style={styles.selectPhotoButton} onPress={selectPhoto}>
        <Icon name="image-outline" size={20} color={colors.primary} />
        <Text style={styles.selectPhotoText}>Select Photo</Text>
        <Text style={styles.requiredStar}>*</Text>
      </TouchableOpacity>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Blue Denim Jacket"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Brand */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Brand <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter brand name"
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Category <Text style={styles.requiredStar}>*</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Color */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Color <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Black, White, Blue"
            value={color}
            onChangeText={setColor}
          />
        </View>

        {/* Size — free text is the source of truth; chips are quick-fill
            suggestions so any real printed size can still be entered. */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Size <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., M, 32x34, EU 42, 8"
            value={size}
            onChangeText={setSize}
          />
          <Text style={styles.sizeHint}>Suggestions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sizeList}
          >
            {sizes.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sizeChip, size === s && styles.sizeChipActive]}
                onPress={() => setSize(s)}
              >
                <Text
                  style={[
                    styles.sizeChipText,
                    size === s && styles.sizeChipTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes about this item..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Next/Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: '35%',
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  selectPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.white,
    gap: 8,
  },
  selectPhotoText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  requiredStar: {
    color: colors.error,
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryList: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  sizeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  sizeList: {
    flexDirection: 'row',
  },
  sizeChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sizeChipActive: {
    backgroundColor: colors.primary,
  },
  sizeChipText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  sizeChipTextActive: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  headerRightSpacer: {
    width: 40,
  },
});
