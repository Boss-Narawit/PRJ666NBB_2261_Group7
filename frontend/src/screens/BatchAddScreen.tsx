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

// A staged item carries the API-ready input plus a local preview uri for the list.
type StagedItem = { input: NewClothingInput; previewUri: string };

export default function BatchAddScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [staged, setStaged] = useState<StagedItem[]>([]);
  const [adding, setAdding] = useState(false); // uploading the current photo
  const [submitting, setSubmitting] = useState(false); // uploading the whole batch

  // Current draft item
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');

  const sizes = getSizeOptions(category);

  const resetForm = () => {
    setPhoto(null);
    setName('');
    setBrand('');
    setCategory('');
    setColor('');
    setSize('');
    setDescription('');
  };

  const selectPhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, includeBase64: false },
      response => {
        if (response.assets && response.assets[0]?.uri) {
          setPhoto(response.assets[0]);
        } else if (response.didCancel) {
          // cancelled — no action
        } else {
          Alert.alert('Error', 'Failed to select photo');
        }
      },
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
      !photo?.uri && 'Photo',
    ].filter(Boolean);
    // The photo check is part of `missing`; repeating it here narrows `photo`
    // to non-null for the code below.
    if (!photo?.uri || missing.length > 0) {
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
      const imageUrl = await uploadClothingImage(token, photo);
      const input: NewClothingInput = {
        name,
        brand,
        category,
        color,
        size,
        imageUrl,
        notes: description,
      };
      setStaged(prev => [...prev, { input, previewUri: photo.uri! }]);
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
      <View style={styles.header}>
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

        <TouchableOpacity
          style={styles.selectPhotoButton}
          onPress={selectPhoto}
        >
          <Icon name="image-outline" size={20} color={colors.primary} />
          <Text style={styles.selectPhotoText}>
            {photo ? 'Change Photo' : 'Select Photo'}
          </Text>
          <Text style={styles.requiredStar}>*</Text>
        </TouchableOpacity>

        {photo && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removePhoto}
              onPress={() => setPhoto(null)}
            >
              <Icon name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
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
  selectPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
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
