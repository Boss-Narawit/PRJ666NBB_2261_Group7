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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import {
  uploadClothingImage,
  bulkCreateClothing,
  NewClothingInput,
} from '../services/api';
import { CLOTHING_CATEGORIES, getSizeOptions } from '../constants/categories';

type Props = {
  navigation: any;
};

// BR5: the backend rejects a batch over 50; guard client-side for UX.
const MAX_BATCH = 50;
// Up to 5 photos per item (mirrors MAX_CLOTHING_IMAGES); first is the cover.
const MAX_IMAGES = 5;

// A staged item carries the API-ready input plus a local preview uri for the list.
type StagedItem = { input: NewClothingInput; previewUri: string };

export default function BatchAddScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [staged, setStaged] = useState<StagedItem[]>([]);
  const [adding, setAdding] = useState(false); // uploading the current photo
  const [submitting, setSubmitting] = useState(false); // uploading the whole batch

  // Current draft item — up to MAX_IMAGES photos, first is the cover.
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');

  const sizes = getSizeOptions(category);

  const resetForm = () => {
    setPhotos([]);
    setName('');
    setBrand('');
    setCategory('');
    setColor('');
    setSize('');
    setDescription('');
  };

  // Shared handler for both pickers — appends photo(s) to the draft, capped at
  // MAX_IMAGES (the library can return several at once).
  const handlePickerResponse = (
    response: ImagePickerResponse,
    failMessage: string,
  ) => {
    if (response.assets && response.assets.length > 0) {
      const picked = response.assets.filter(a => a.uri);
      setPhotos(prev => {
        const room = MAX_IMAGES - prev.length;
        if (room <= 0) {
          Alert.alert(
            'Photo limit',
            `You can add up to ${MAX_IMAGES} photos per item.`,
          );
          return prev;
        }
        if (picked.length > room) {
          Alert.alert(
            'Photo limit',
            `Only ${room} more photo${room > 1 ? 's' : ''} added (max ${MAX_IMAGES}).`,
          );
        }
        return [...prev, ...picked.slice(0, room)];
      });
    } else if (response.didCancel) {
      // cancelled — no action
    } else {
      Alert.alert('Error', failMessage);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Capture a photo with the device camera.
  const takePhoto = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        saveToPhotos: false,
      },
      response => handlePickerResponse(response, 'Failed to take photo'),
    );
  };

  // Pick one or more existing images from the library.
  const selectPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        selectionLimit: MAX_IMAGES,
      },
      response => handlePickerResponse(response, 'Failed to select photo'),
    );
  };

  const addToBatch = async () => {
    if (staged.length >= MAX_BATCH) {
      Alert.alert(
        'Batch full',
        `You can add up to ${MAX_BATCH} items at once.`,
      );
      return;
    }
    // Same BR4 validation as the single-add form, on trimmed/parsed values.
    const hasColor = color
      .split(',')
      .map(c => c.trim())
      .some(Boolean);
    // Name the exact missing fields so a failed add says what to fix.
    const missing = [
      !name.trim() && 'Name',
      !brand.trim() && 'Brand',
      !category && 'Category',
      !hasColor && 'Color',
      !size && 'Size',
      photos.length === 0 && 'Photo',
    ].filter(Boolean);
    if (missing.length > 0) {
      Alert.alert(
        'Error',
        `Please fill the required field${
          missing.length > 1 ? 's' : ''
        }: ${missing.join(', ')}`,
      );
      return;
    }
    if (!token) return;

    setAdding(true);
    try {
      // First photo is the cover (imageUrl = images[0]).
      const images = await Promise.all(
        photos.map(p => uploadClothingImage(token, p)),
      );
      const input: NewClothingInput = {
        name,
        brand,
        category,
        color,
        size,
        imageUrl: images[0],
        images,
        notes: description,
      };
      setStaged(prev => [...prev, { input, previewUri: photos[0].uri! }]);
      resetForm();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add item to the batch');
    } finally {
      setAdding(false);
    }
  };

  const removeStaged = (index: number) => {
    setStaged(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (!token || staged.length === 0) return;
    setSubmitting(true);
    try {
      await bulkCreateClothing(
        token,
        staged.map(s => s.input),
      );
      Alert.alert('Success', `${staged.length} items added to your wardrobe!`, [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.isFocused()) navigation.goBack();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to upload the batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={submitting}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batch Add</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Staged items */}
        <Text style={styles.sectionTitle}>
          Items to add ({staged.length}/{MAX_BATCH})
        </Text>
        {staged.length === 0 ? (
          <Text style={styles.emptyHint}>
            Build up a batch below, then upload them all at once.
          </Text>
        ) : (
          staged.map((s, index) => (
            <View key={`${s.input.imageUrl}-${index}`} style={styles.stagedRow}>
              <Image
                source={{ uri: s.previewUri }}
                style={styles.stagedThumb}
              />
              <View style={styles.stagedInfo}>
                <Text style={styles.stagedName} numberOfLines={1}>
                  {s.input.name}
                </Text>
                <Text style={styles.stagedBrand} numberOfLines={1}>
                  {s.input.brand}
                  {(s.input.images?.length ?? 1) > 1
                    ? ` · ${s.input.images!.length} photos`
                    : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeStaged(index)}
                disabled={submitting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Draft item form */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Add an item</Text>

        <Text style={styles.label}>
          Photos <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={styles.photoButtonsRow}>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Icon name="camera-outline" size={20} color={colors.primary} />
            <Text style={styles.selectPhotoText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={selectPhoto}>
            <Icon name="image-outline" size={20} color={colors.primary} />
            <Text style={styles.selectPhotoText}>
              {photos.length > 0 ? 'Add More' : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <>
            <Text style={styles.galleryHint}>
              {photos.length}/{MAX_IMAGES} photos · first is the cover
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gallery}
              contentContainerStyle={styles.galleryContent}
            >
              {photos.map((p, index) => (
                <View key={`${p.uri}-${index}`} style={styles.galleryItem}>
                  <Image source={{ uri: p.uri }} style={styles.galleryImage} />
                  {index === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.galleryRemove}
                    onPress={() => removePhoto(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close-circle" size={22} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.form}>
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

          <View style={styles.field}>
            <Text style={styles.label}>
              Category <Text style={styles.requiredStar}>*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryList}
            >
              {CLOTHING_CATEGORIES.map(cat => (
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

          <TouchableOpacity
            style={styles.addToBatchButton}
            onPress={addToBatch}
            disabled={adding || submitting}
          >
            {adding ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Icon name="add" size={20} color={colors.primary} />
                <Text style={styles.addToBatchText}>Add to batch</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed footer — upload the whole batch */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (staged.length === 0 || submitting) && styles.uploadButtonDisabled,
          ]}
          onPress={uploadAll}
          disabled={staged.length === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.uploadButtonText}>
              Upload All ({staged.length})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  headerRightSpacer: {
    width: 40,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  stagedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 12,
  },
  stagedThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  stagedInfo: {
    flex: 1,
  },
  stagedName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stagedBrand: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginTop: 20,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
  galleryHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  gallery: {
    marginBottom: 12,
  },
  galleryContent: {
    gap: 12,
    paddingRight: 8,
  },
  galleryItem: {
    position: 'relative',
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  coverBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  galleryRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  form: {
    marginTop: 4,
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
  addToBatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: 6,
  },
  addToBatchText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
