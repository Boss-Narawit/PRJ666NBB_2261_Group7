import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  getForgottenItems,
  createWearLog,
  updateProfile,
  Clothing,
} from '../services/api';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Days since the item was last worn — falls back to createdAt for never-worn items.
function unwornDaysOf(item: Clothing) {
  const ref = item.analytics?.lastWornAt ?? item.createdAt;
  if (!ref) return 0;
  return Math.floor((Date.now() - new Date(ref).getTime()) / MS_PER_DAY);
}

function lastWornLabel(item: Clothing) {
  const worn = item.analytics?.lastWornAt;
  return worn ? new Date(worn).toLocaleDateString() : 'Never worn';
}

type Props = {
  navigation: any;
};

export default function ForgottenItemsScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<Clothing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [thresholdDays, setThresholdDays] = useState('21');
  const [selectedItem, setSelectedItem] = useState<Clothing | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getForgottenItems(token);
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load forgotten items.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleItemPress = (item: Clothing) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const handleLogWear = () => {
    if (!selectedItem || !token) return;
    const item = selectedItem;
    Alert.alert('Log Wear', `Log "${item.name}" as worn today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Wear',
        onPress: async () => {
          try {
            await createWearLog(token, {
              logDate: new Date().toISOString(),
              clothingWorn: [{ itemId: item._id }],
            });
          } catch (err: any) {
            Alert.alert('Log Wear', err.message || 'Could not log wear.');
            return;
          }
          setShowItemDetail(false);
          Alert.alert('Success', `${item.name} logged as worn today!`);
          // Worn today → no longer forgotten; refetch drops it from the list.
          load();
        },
      },
    ]);
  };

  const handleExportDonate = () => {
    setShowItemDetail(false);
    if (selectedItem) navigation.navigate('Export', { item: selectedItem });
  };

  const handleSaveSettings = async () => {
    const days = parseInt(thresholdDays, 10);
    if (isNaN(days) || days < 7) {
      Alert.alert('Error', 'Minimum threshold is 7 days (BR12)');
      return;
    }
    if (!token) return;
    try {
      await updateProfile(token, { forgottenItemThresholdDays: days });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save settings.');
      return;
    }
    setShowSettingsModal(false);
    Alert.alert(
      'Settings Saved',
      `Forgotten item threshold set to ${days} days`,
    );
    // New threshold changes which items count as forgotten — refetch.
    load();
  };

  const renderForgottenItem = ({ item }: { item: Clothing }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.itemImage}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        ) : (
          <Icon name="shirt-outline" size={30} color={colors.textSecondary} />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          {item.category} • {item.brand} • {item.colors?.[0] ?? '—'}
        </Text>
        <Text style={styles.itemLastWorn}>
          Last worn: {lastWornLabel(item)}
        </Text>
      </View>
      <View style={styles.unwornBadge}>
        <Text style={styles.unwornBadgeText}>{unwornDaysOf(item)}d</Text>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Forgotten Items</Text>
        <TouchableOpacity
          onPress={() => setShowSettingsModal(true)}
          style={styles.settingsButton}
        >
          <Icon name="settings-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Unworn Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>{items.length} items forgotten</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Forgotten Items List */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderForgottenItem}
          keyExtractor={item => item._id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="checkmark-circle-outline"
                size={60}
                color={colors.primary}
              />
              <Text style={styles.emptyText}>
                No forgotten items — well done!
              </Text>
            </View>
          }
        />
      )}

      {/* Item Detail Modal */}
      <Modal visible={showItemDetail} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
              <TouchableOpacity onPress={() => setShowItemDetail(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalImage}>
                {selectedItem?.imageUrl ? (
                  <Image
                    source={{ uri: selectedItem.imageUrl }}
                    style={styles.modalThumbnail}
                  />
                ) : (
                  <Icon
                    name="shirt-outline"
                    size={60}
                    color={colors.textSecondary}
                  />
                )}
              </View>

              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  <Text style={styles.modalInfoLabel}>Brand: </Text>
                  {selectedItem?.brand}
                </Text>
                <Text style={styles.modalInfoText}>
                  <Text style={styles.modalInfoLabel}>Category: </Text>
                  {selectedItem?.category}
                </Text>
                <Text style={styles.modalInfoText}>
                  <Text style={styles.modalInfoLabel}>Color: </Text>
                  {selectedItem?.colors?.join(', ')}
                </Text>
                <Text style={styles.modalInfoText}>
                  <Text style={styles.modalInfoLabel}>Condition: </Text>
                  {selectedItem?.condition}
                </Text>
                <Text style={styles.modalInfoText}>
                  <Text style={styles.modalInfoLabel}>Last worn: </Text>
                  {selectedItem ? lastWornLabel(selectedItem) : ''}
                </Text>
                <Text style={styles.modalUnworn}>
                  Unworn for {selectedItem ? unwornDaysOf(selectedItem) : 0}{' '}
                  days
                </Text>
              </View>

              <View style={styles.modalActions}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Forgotten Item Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsBody}>
              <Text style={styles.settingsLabel}>Date range (days)</Text>
              <TextInput
                style={styles.settingsInput}
                value={thresholdDays}
                onChangeText={setThresholdDays}
                keyboardType="numeric"
                placeholder="21"
              />
              <Text style={styles.settingsHint}>Minimum: 7 days</Text>
            </View>

            <View style={styles.settingsActions}>
              <TouchableOpacity
                style={styles.cancelSettingsButton}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelSettingsText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveSettingsButton}
                onPress={handleSaveSettings}
              >
                <Text style={styles.saveSettingsText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  settingsButton: {
    padding: 8,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  itemDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemLastWorn: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  unwornBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unwornBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 20,
  },
  settingsModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalInfo: {
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
  modalInfoLabel: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalUnworn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  settingsBody: {
    marginBottom: 20,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  settingsInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  settingsHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  settingsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelSettingsButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  cancelSettingsText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  saveSettingsButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveSettingsText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 12,
  },
  thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  modalThumbnail: { width: '100%', height: '100%', borderRadius: 12 },
  loading: { marginTop: 24 },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
