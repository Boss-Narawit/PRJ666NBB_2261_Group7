import React, { useCallback, useMemo, useState } from 'react';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import {
  getClothingById,
  updateClothing,
  createWearLog,
  ClothingUpdate,
  Clothing,
} from '../services/api';
import { getSizeOptions } from '../constants/categories';
import { localDateString } from '../utils/date';

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
  status: string;
  exportInfo?: { partnerName?: string; type?: string; exportedAt?: string };
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
    color: c.colors?.join(', ') ?? '',
    size: c.size,
    description: c.notes ?? '',
    condition: c.condition,
    image: c.imageUrl || null,
    wearCount: c.analytics?.wearCount ?? 0,
    lastWorn: c.analytics?.lastWornAt
      ? c.analytics.lastWornAt.slice(0, 10)
      : 'Never',
    status: c.status,
    exportInfo: c.exportInfo,
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

// The Clothing model's condition enum — used verbatim, no lossy remap.
const conditions = ['Excellent', 'Good', 'Fair', 'Damaged'];

// Map an edited display field onto the Clothing model's shape for PATCH.
// Exported for unit testing — this is the reconciliation the screen hinges on.
export function fieldToPatch(field: string, value: string): ClothingUpdate {
  switch (field) {
    case 'category':
      return { category: value.toLowerCase() };
    case 'color':
      // model stores colors[]; UI edits the full comma-separated list
      // (mirrors AddCloth's convention — see createClothing in api.ts).
      return {
        colors: value
          .split(',')
          .map(c => c.trim())
          .filter(Boolean),
      };
    case 'description':
      return { notes: value };
    default:
      return { [field]: value }; // brand, size, condition
  }
}

export default function ItemDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const itemId = route?.params?.itemId;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerField, setPickerField] = useState<string>('');

  // The raw API document is the fetched state, kept so "Export/Donate" can
  // hand Export a real Clothing (Export preselects by _id — the display item
  // only exposes `id`); mutations write the server response back via setRawItem.
  const fetchItem = useCallback(
    async (t: string): Promise<Clothing | null> => {
      if (!itemId) throw new Error('Missing item reference.');
      return getClothingById(t, itemId);
    },
    [itemId],
  );
  const {
    data: rawItem,
    setData: setRawItem,
    isLoading,
    error,
  } = useFocusedFetch(token, fetchItem, 'Failed to load item.', null);

  const item = useMemo(
    () => (rawItem ? toDisplayItem(rawItem) : null),
    [rawItem],
  );

  // An item that has left the wardrobe (archived or exported) is fully
  // locked — no edits, no header menu, no wear/export actions. Exported
  // items additionally get a "where it went" banner (rendered below).
  const isLocked = item?.status !== 'Available';
  const isExported = item?.status === 'Exported';

  const handleEditField = (field: string, currentValue: string) => {
    // Category uses the picker modal (strict enum). Size is free text (with
    // suggestion chips in the modal) so any printed label can be entered.
    if (field === 'category') {
      setPickerOptions(categories);
      setPickerField('category');
      setShowPickerModal(true);
      return;
    }
    // Other fields (incl. size) use the text input modal
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
      // Size is free text now, so a category change never invalidates it.
      setRawItem(updated);
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

  // Header "⋮" menu: archive the item (BR23 — preserves wear-log history), then
  // return to the wardrobe (which refetches on focus and hides archived items).
  const handleOpenMenu = () => {
    if (!item) return;
    Alert.alert(item.name, undefined, [
      {
        text: 'Archive Item',
        style: 'destructive',
        onPress: handleArchive,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleArchive = () => {
    if (!item) return;
    Alert.alert(
      'Archive Item',
      `Archive "${item.name}"? It will be hidden from your wardrobe but its history is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            if (!item || !token) return;
            try {
              await updateClothing(token, item.id, { status: 'Archived' });
            } catch (err: any) {
              Alert.alert(
                'Archive Item',
                err.message || 'Could not archive item.',
              );
              return;
            }
            navigation.goBack();
          },
        },
      ],
    );
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
              logDate: localDateString(),
              clothingWorn: [{ itemId: item.id }],
            });
          } catch (err: any) {
            Alert.alert('Log Wear', err.message || 'Could not log wear.');
            return;
          }
          // Log is committed. Wear count / last-worn are derived server-side
          // (BR9) — refetch to reflect them, but a failed refetch is non-fatal.
          Alert.alert('Success', `${item.name} logged as worn today!`);
          try {
            const refreshed = await getClothingById(token, item.id);
            setRawItem(refreshed);
          } catch {
            // The next focus refetch will reconcile the displayed counts.
          }
        },
      },
    ]);
  };

  const handleExportDonate = () => {
    if (rawItem) navigation.navigate('Export', { item: rawItem });
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
    // Items that have left the wardrobe are read-only — no edit affordance,
    // no tap-to-edit.
    const readOnly = isLocked;

    const inner = (
      <>
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
          {!readOnly && (
            <Icon name="create-outline" size={18} color={colors.primary} />
          )}
        </View>
      </>
    );

    if (readOnly) {
      return <View style={styles.fieldRow}>{inner}</View>;
    }
    return (
      <TouchableOpacity
        style={styles.fieldRow}
        onPress={() => handleEditField(field, value)}
        activeOpacity={0.7}
      >
        {inner}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item?.name ?? 'Item Detail'}
        </Text>
        {isLocked ? (
          <View style={styles.moreButton} />
        ) : (
          <TouchableOpacity onPress={handleOpenMenu} style={styles.moreButton}>
            <Icon
              name="ellipsis-vertical"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !item ? (
        <View style={styles.centered}>
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
      ) : (
        <>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Item Image */}
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon
                    name="shirt-outline"
                    size={80}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </View>

            {/* Exported banner — shows where the item went (read-only screen) */}
            {isExported && (
              <View style={styles.exportedBanner}>
                <Icon
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
                <View style={styles.exportedBannerText}>
                  <Text style={styles.exportedBannerTitle}>Exported</Text>
                  <Text style={styles.exportedBannerSub}>
                    {`→ ${item.exportInfo?.partnerName ?? 'Partner'}`}
                    {item.exportInfo?.exportedAt
                      ? ` · ${item.exportInfo.exportedAt.slice(0, 10)}`
                      : ''}
                  </Text>
                </View>
              </View>
            )}

            {/* Archived banner — hidden from the wardrobe, history preserved */}
            {item.status === 'Archived' && (
              <View style={styles.archivedBanner}>
                <Icon
                  name="archive-outline"
                  size={22}
                  color={colors.textSecondary}
                />
                <View style={styles.archivedBannerText}>
                  <Text style={styles.archivedBannerTitle}>Archived</Text>
                  <Text style={styles.archivedBannerSub}>
                    Hidden from your wardrobe
                  </Text>
                </View>
              </View>
            )}

            {/* Damaged → referral to the local tailor/upcycling directory */}
            {!isLocked && item.condition === 'Damaged' && (
              <TouchableOpacity
                style={styles.repairBanner}
                onPress={() => navigation.navigate('CareDirectory')}
              >
                <Icon
                  name="construct-outline"
                  size={22}
                  color={colors.primary}
                />
                <View style={styles.repairBannerText}>
                  <Text style={styles.repairBannerTitle}>Needs a repair?</Text>
                  <Text style={styles.repairBannerSub}>
                    Find local tailors & upcycling shops
                  </Text>
                </View>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            {/* Details Card */}
            <View style={styles.card}>
              {renderField('Name', item.name, 'name')}
              {renderField('Brand', item.brand, 'brand')}
              {renderField('Category', item.category, 'category')}
              {renderField('Color', item.color, 'color')}
              {renderField('Size', item.size, 'size')}

              {/* Description - separate because it's multiline */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Description</Text>
                {isLocked ? (
                  <View style={styles.fieldValueContainer}>
                    <Text
                      style={[styles.fieldValue, styles.descriptionText]}
                      numberOfLines={2}
                    >
                      {item.description || 'No description'}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.fieldValueContainer}
                    onPress={() =>
                      handleEditField('description', item.description)
                    }
                  >
                    <Text
                      style={[styles.fieldValue, styles.descriptionText]}
                      numberOfLines={2}
                    >
                      {item.description || 'No description'}
                    </Text>
                    <Icon
                      name="create-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Condition Section */}
            <View style={styles.conditionSection}>
              <Text style={styles.conditionLabel}>Condition</Text>
              {isLocked ? (
                <View
                  style={[
                    styles.conditionBadge,
                    {
                      backgroundColor: getConditionColor(item.condition) + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.conditionText,
                      { color: getConditionColor(item.condition) },
                    ]}
                  >
                    {item.condition}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.conditionBadge,
                    {
                      backgroundColor: getConditionColor(item.condition) + '20',
                    },
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
              )}
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

            {/* Action Buttons — hidden once the item has left the wardrobe */}
            {!isLocked && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.logWearButton}
                  onPress={handleLogWear}
                >
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
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Edit Modal (free-text fields: Brand, Color, Size, Description) */}
          <Modal
            visible={showEditModal}
            transparent={true}
            animationType="slide"
          >
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
                  placeholder={
                    editingField === 'size'
                      ? 'e.g., M, 32x34, EU 42, 8'
                      : `Enter ${editingField}`
                  }
                  multiline={editingField === 'description'}
                  numberOfLines={editingField === 'description' ? 4 : 1}
                />

                {/* Quick-fill size suggestions — tapping fills the input above. */}
                {editingField === 'size' && (
                  <>
                    <Text style={styles.sizeHint}>Suggestions</Text>
                    <View style={styles.suggestionRow}>
                      {getSizeOptions(item.category).map(s => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.suggestionChip,
                            editValue === s && styles.suggestionChipActive,
                          ]}
                          onPress={() => setEditValue(s)}
                        >
                          <Text
                            style={[
                              styles.suggestionChipText,
                              editValue === s &&
                                styles.suggestionChipTextActive,
                            ]}
                          >
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

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

          {/* Picker Modal (for Category and Condition) */}
          <Modal
            visible={showPickerModal}
            transparent={true}
            animationType="slide"
          >
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
        </>
      )}
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
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  moreButton: {
    padding: 8,
  },
  body: {
    flex: 1,
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
  exportedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  exportedBannerText: {
    flex: 1,
  },
  exportedBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  exportedBannerSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  archivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.textSecondary + '12',
    borderWidth: 1,
    borderColor: colors.textSecondary + '40',
  },
  archivedBannerText: {
    flex: 1,
  },
  archivedBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  archivedBannerSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  repairBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  repairBannerText: {
    flex: 1,
  },
  repairBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  repairBannerSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
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
  sizeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  suggestionChipActive: {
    backgroundColor: colors.primary,
  },
  suggestionChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  suggestionChipTextActive: {
    color: colors.white,
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
    flex: 1,
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
