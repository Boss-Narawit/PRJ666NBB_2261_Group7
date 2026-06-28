import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  getClothingById,
  updateClothing,
  createWearLog,
  ClothingUpdate,
  Clothing,
} from '../services/api';

type Props = {
  navigation: any;
  route?: {
    params?: {
      itemId?: string;
    };
  };
};

// The screen's editable display shape, mapped from the API Clothing document.
type DisplayItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  color: string;
  size: string;
  description: string;
  condition: string;
  image: string | null;
  wearCount: number;
  lastWorn: string;
};

// The model stores category lowercase (tops/bottoms/...); show it title-cased.
const toTitle = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

function toDisplayItem(c: Clothing): DisplayItem {
  return {
    id: c._id,
    name: c.name,
    brand: c.brand,
    category: toTitle(c.category),
    color: c.colors?.[0] ?? '',
    size: c.size,
    description: c.notes ?? '',
    condition: c.condition,
    image: c.imageUrl || null,
    wearCount: c.analytics?.wearCount ?? 0,
    lastWorn: c.analytics?.lastWornAt
      ? c.analytics.lastWornAt.slice(0, 10)
      : 'Never',
  };
}

// Title-cased labels of the model's category enum (mapped back to lowercase on save).
const categories = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
  'Other',
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// The Clothing model's condition enum — used verbatim, no lossy remap.
const conditions = ['Excellent', 'Good', 'Fair', 'Damaged'];

// Map an edited display field onto the Clothing model's shape for PATCH.
// Exported for unit testing — this is the reconciliation the screen hinges on.
export function fieldToPatch(field: string, value: string): ClothingUpdate {
  switch (field) {
    case 'category':
      return { category: value.toLowerCase() };
    case 'color':
      return { colors: [value] }; // model stores colors[]; UI edits the primary color
    case 'description':
      return { notes: value };
    default:
      return { [field]: value }; // brand, size, condition
  }
}

export default function ItemDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const itemId = route?.params?.itemId;
  const [item, setItem] = useState<DisplayItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerField, setPickerField] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      if (!token || !itemId) {
        setError('Missing item reference.');
        setIsLoading(false);
        return;
      }
      let cancelled = false;
      getClothingById(token, itemId)
        .then(data => {
          if (!cancelled) {
            setItem(toDisplayItem(data));
            setError(null);
          }
        })
        .catch(err => {
          if (!cancelled) setError(err.message || 'Failed to load item.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [token, itemId]),
  );

  const handleEditField = (field: string, currentValue: string) => {
    // Category and Size should use the picker modal with predefined options
    if (field === 'category') {
      setPickerOptions(categories);
      setPickerField('category');
      setShowPickerModal(true);
      return;
    }
    if (field === 'size') {
      setPickerOptions(sizes);
      setPickerField('size');
      setShowPickerModal(true);
      return;
    }
    // Other fields use text input modal
    setEditingField(field);
    setEditValue(currentValue);
    setShowEditModal(true);
  };

  // PATCH a single edited field, then re-render from the server's response
  // (server is authoritative — keeps display in sync with stored enums).
  const persistField = async (field: string, value: string) => {
    if (!item || !token) return;
    try {
      const updated = await updateClothing(
        token,
        item.id,
        fieldToPatch(field, value),
      );
      setItem(toDisplayItem(updated));
    } catch (err: any) {
      Alert.alert('Update failed', err.message || 'Could not save changes.');
    }
  };

  const handlePickerSelect = (value: string) => {
    setShowPickerModal(false);
    persistField(pickerField, value);
  };

  const handleSaveEdit = () => {
    if (!editingField) return;
    const field = editingField;
    setShowEditModal(false);
    setEditingField(null);
    persistField(field, editValue);
  };

  const handleLogWear = () => {
    if (!item || !token) return;
    Alert.alert('Log Wear', `Log "${item.name}" as worn today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Wear',
        onPress: async () => {
          try {
            await createWearLog(token, {
              logDate: new Date().toISOString(),
              clothingWorn: [{ itemId: item.id }],
            });
          } catch (err: any) {
            const msg =
              err.status === 409
                ? 'You already logged a wear for today.'
                : err.message || 'Could not log wear.';
            Alert.alert('Log Wear', msg);
            return;
          }
          // Log is committed. Wear count / last-worn are derived server-side
          // (BR9) — refetch to reflect them, but a failed refetch is non-fatal.
          Alert.alert('Success', `${item.name} logged as worn today!`);
          try {
            const refreshed = await getClothingById(token, item.id);
            setItem(toDisplayItem(refreshed));
          } catch {
            // The next focus refetch will reconcile the displayed counts.
          }
        },
      },
    ]);
  };

  const handleExportDonate = () => {
    navigation.navigate('Export');
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return '#38A169';
      case 'Good':
        return '#48BB78';
      case 'Fair':
        return '#ED8936';
      case 'Damaged':
        return '#E53E3E';
      default:
        return colors.textSecondary;
    }
  };

  const renderField = (label: string, value: string, field: string) => {
    // Check if field should show a chip or text
    const isChipField = field === 'category' || field === 'size';
    const displayValue =
      value ||
      (field === 'category'
        ? 'Select Category'
        : field === 'size'
          ? 'Select Size'
          : 'Not set');

    return (
      <TouchableOpacity
        style={styles.fieldRow}
        onPress={() => handleEditField(field, value)}
        activeOpacity={0.7}
      >
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldValueContainer}>
          {isChipField ? (
            <View
              style={[
                styles.fieldChip,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Text style={[styles.fieldChipText, { color: colors.primary }]}>
                {displayValue}
              </Text>
            </View>
          ) : (
            <Text
              style={styles.fieldValue}
              numberOfLines={field === 'description' ? 2 : 1}
            >
              {displayValue}
            </Text>
          )}
          <Icon name="create-outline" size={18} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon
          name="alert-circle-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.errorText}>{error || 'Item not found.'}</Text>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Item Detail</Text>
        <TouchableOpacity onPress={() => {}} style={styles.moreButton}>
          <Icon name="ellipsis-vertical" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Item Image */}
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="shirt-outline" size={80} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Item Name */}
      <Text style={styles.itemName}>{item.name}</Text>

      {/* Details Card */}
      <View style={styles.card}>
        {renderField('Brand', item.brand, 'brand')}
        {renderField('Category', item.category, 'category')}
        {renderField('Color', item.color, 'color')}
        {renderField('Size', item.size, 'size')}

        {/* Description - separate because it's multiline */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TouchableOpacity
            style={styles.fieldValueContainer}
            onPress={() => handleEditField('description', item.description)}
          >
            <Text
              style={[styles.fieldValue, styles.descriptionText]}
              numberOfLines={2}
            >
              {item.description || 'No description'}
            </Text>
            <Icon name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Condition Section */}
      <View style={styles.conditionSection}>
        <Text style={styles.conditionLabel}>Condition</Text>
        <TouchableOpacity
          style={[
            styles.conditionBadge,
            { backgroundColor: getConditionColor(item.condition) + '20' },
          ]}
          onPress={() => {
            setPickerOptions(conditions);
            setPickerField('condition');
            setShowPickerModal(true);
          }}
        >
          <Text
            style={[
              styles.conditionText,
              { color: getConditionColor(item.condition) },
            ]}
          >
            {item.condition}
          </Text>
          <Icon
            name="chevron-down"
            size={20}
            color={getConditionColor(item.condition)}
          />
        </TouchableOpacity>
      </View>

      {/* Wear Count */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.wearCount}</Text>
          <Text style={styles.statLabel}>Times Worn</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.lastWorn}</Text>
          <Text style={styles.statLabel}>Last Worn</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.logWearButton} onPress={handleLogWear}>
          <Icon
            name="checkmark-circle-outline"
            size={20}
            color={colors.white}
          />
          <Text style={styles.logWearButtonText}>Log Wear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportDonate}
        >
          <Icon name="send-outline" size={20} color={colors.primary} />
          <Text style={styles.exportButtonText}>Export/Donate</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal (for free-text fields: Brand, Material, Color, Description) */}
      <Modal visible={showEditModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editingField}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editingField}`}
              multiline={editingField === 'description'}
              numberOfLines={editingField === 'description' ? 4 : 1}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.confirmModalText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Picker Modal (for Category, Size, Condition) */}
      <Modal visible={showPickerModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select{' '}
                {pickerField.charAt(0).toUpperCase() + pickerField.slice(1)}
              </Text>
              <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {pickerOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionRow,
                  item[pickerField as keyof typeof item] === option &&
                    styles.optionRowSelected,
                ]}
                onPress={() => handlePickerSelect(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    item[pickerField as keyof typeof item] === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {item[pickerField as keyof typeof item] === option && (
                  <Icon name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowPickerModal(false)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  moreButton: {
    padding: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    width: 80,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  fieldChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  fieldChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionText: {
    flexShrink: 1,
  },
  conditionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  conditionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.inputBorder,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  logWearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  logWearButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  exportButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButton: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  cancelModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  confirmModalButton: {
    backgroundColor: colors.primary,
  },
  confirmModalText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  optionRowSelected: {
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  backLink: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backLinkText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
});
