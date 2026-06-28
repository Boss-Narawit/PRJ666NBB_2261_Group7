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
import { launchImageLibrary } from 'react-native-image-picker';

type Props = {
  navigation: any;
};

export default function AddClothScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  // Form fields
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');

  const categories = [
    'Tops',
    'Bottoms',
    'Dresses',
    'Outerwear',
    'Shoes',
    'Accessories',
    'Activewear',
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const selectPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      response => {
        if (response.assets && response.assets[0]?.uri) {
          setPhoto(response.assets[0].uri);
        } else if (response.didCancel) {
          // user cancelled the picker — no action needed
        } else {
          Alert.alert('Error', 'Failed to select photo');
        }
      },
    );
  };

  const handleSave = async () => {
    // Validation (BR4 - required fields)
    if (!brand || !category || !color || !size || !photo) {
      Alert.alert(
        'Error',
        'Please fill all required fields (Brand, Category, Color, Size, and Photo)',
      );
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to save clothing
      // const formData = new FormData();
      // formData.append('brand', brand);
      // formData.append('category', category);
      // formData.append('color', color);
      // formData.append('size', size);
      // formData.append('photo', { uri: photo, type: 'image/jpeg', name: 'photo.jpg' });
      // await clothingAPI.create(formData);

      Alert.alert('Success', 'Clothing item added!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save clothing item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
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

      {/* Photo Preview */}
      {photo && (
        <View style={styles.photoPreview}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removePhoto}
            onPress={() => setPhoto(null)}
          >
            <Icon name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
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

        {/* Material */}
        <View style={styles.field}>
          <Text style={styles.label}>Material</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Cotton, Denim, Polyester"
            value={material}
            onChangeText={setMaterial}
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

        {/* Size */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Size <Text style={styles.requiredStar}>*</Text>
          </Text>
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
  recentSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  recentList: {
    paddingLeft: 16,
  },
  recentItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  recentItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentItemName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  recentItemWorn: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
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
