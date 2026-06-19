import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

// Mock data for forgotten items
const forgottenItemsData = [
  {
    id: '1',
    name: 'Muji Sweater',
    brand: 'Muji',
    category: 'Sweater',
    color: 'Grey',
    lastWorn: '2026-01-29',
    unwornDays: 32,
    image: null,
    condition: 'Worn',
  },
  {
    id: '2',
    name: 'Winter Jacket',
    brand: 'North Face',
    category: 'Jacket',
    color: 'Black',
    lastWorn: '2026-01-20',
    unwornDays: 45,
    image: null,
    condition: 'Good',
  },
  {
    id: '3',
    name: 'Floral Dress',
    brand: 'Zara',
    category: 'Dress',
    color: 'Pink',
    lastWorn: '2026-02-01',
    unwornDays: 28,
    image: null,
    condition: 'Excellent',
  },
  {
    id: '4',
    name: 'Denim Jacket',
    brand: "Levi's",
    category: 'Jacket',
    color: 'Blue',
    lastWorn: '2026-01-15',
    unwornDays: 50,
    image: null,
    condition: 'Good',
  },
];

type Props = {
  navigation: any;
};

export default function ForgottenItemsScreen({ navigation }: Props) {
  const [selectedFilter, setSelectedFilter] = useState('Last 30 Days');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [thresholdDays, setThresholdDays] = useState('21');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);

  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleItemPress = (item: any) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const handleLogWear = () => {
    Alert.alert('Log Wear', 'This item has been logged as worn today!');
    setShowItemDetail(false);
  };

  const handleExportDonate = () => {
    setShowItemDetail(false);
    navigation.navigate('Export');
  };

  const handleSaveSettings = () => {
    const days = parseInt(thresholdDays);
    if (isNaN(days) || days < 7) {
      Alert.alert('Error', 'Minimum threshold is 7 days (BR12)');
      return;
    }
    setShowSettingsModal(false);
    Alert.alert('Settings Saved', `Forgotten item threshold set to ${days} days`);
  };

  const renderForgottenItem = ({ item }: { item: typeof forgottenItemsData[0] }) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => handleItemPress(item)}>
      <View style={styles.itemImage}>
        <Icon name="shirt-outline" size={30} color={colors.textSecondary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          {item.category} • {item.brand} • {item.color}
        </Text>
        <Text style={styles.itemLastWorn}>Last worn: {item.lastWorn}</Text>
      </View>
      <View style={styles.unwornBadge}>
        <Text style={styles.unwornBadgeText}>{item.unwornDays}d</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgotten Items</Text>
        <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={styles.settingsButton}>
          <Icon name="settings-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
        {['Last 7 Days', 'Last 30 Days', 'Custom'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.chip, selectedFilter === filter && styles.chipActive]}
            onPress={() => handleFilterPress(filter)}
          >
            <Text style={[styles.chipText, selectedFilter === filter && styles.chipTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Unworn Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {forgottenItemsData.length} items forgotten
        </Text>
      </View>

      {/* Forgotten Items List */}
      <FlatList
        data={forgottenItemsData}
        renderItem={renderForgottenItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="checkmark-circle-outline" size={60} color={colors.primary} />
            <Text style={styles.emptyText}>No forgotten items — well done!</Text>
          </View>
        }
      />

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
                <Icon name="shirt-outline" size={60} color={colors.textSecondary} />
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
                  {selectedItem?.color}
                </Text>
                <Text style={styles.modalInfoText}>
                  <Text style={styles.modalInfoLabel}>Condition: </Text>
                  {selectedItem?.condition}
                </Text>
                <Text style={styles.modalInfoText}>
                  <Text style={styles.modalInfoLabel}>Last worn: </Text>
                  {selectedItem?.lastWorn}
                </Text>
                <Text style={styles.modalUnworn}>
                  Unworn for {selectedItem?.unwornDays} days
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.logWearButton} onPress={handleLogWear}>
                  <Icon name="checkmark-circle-outline" size={20} color={colors.white} />
                  <Text style={styles.logWearButtonText}>Log Wear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportButton} onPress={handleExportDonate}>
                  <Icon name="send-outline" size={20} color={colors.primary} />
                  <Text style={styles.exportButtonText}>Export/Donate</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} animationType="slide" transparent={true}>
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
  filterChips: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
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
});