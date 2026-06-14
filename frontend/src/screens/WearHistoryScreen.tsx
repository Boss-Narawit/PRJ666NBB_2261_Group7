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

// Mock data for wear history
const wearHistoryData = [
  {
    id: '1',
    date: '2026-01-29',
    items: [
      { name: 'Black Hoodie', brand: 'Nike', wearCount: 12, category: 'Tops' },
      {
        name: 'Blue Jeans',
        brand: "Levi's",
        wearCount: 8,
        category: 'Bottoms',
      },
      {
        name: 'White Sneakers',
        brand: 'Adidas',
        wearCount: 15,
        category: 'Shoes',
      },
    ],
  },
  {
    id: '2',
    date: '2026-01-28',
    items: [
      { name: 'Grey Sweater', brand: 'Muji', wearCount: 5, category: 'Tops' },
      {
        name: 'Black Pants',
        brand: 'Uniqlo',
        wearCount: 10,
        category: 'Bottoms',
      },
      {
        name: 'Leather Boots',
        brand: 'Dr. Martens',
        wearCount: 8,
        category: 'Shoes',
      },
    ],
  },
  {
    id: '3',
    date: '2026-01-27',
    items: [
      {
        name: 'Floral Dress',
        brand: 'Zara',
        wearCount: 3,
        category: 'Dresses',
      },
      {
        name: 'Denim Jacket',
        brand: "Levi's",
        wearCount: 6,
        category: 'Outerwear',
      },
    ],
  },
  {
    id: '4',
    date: '2026-01-26',
    items: [
      { name: 'White Shirt', brand: 'Uniqlo', wearCount: 20, category: 'Tops' },
      {
        name: 'Beige Blazer',
        brand: 'J.Crew',
        wearCount: 1,
        category: 'Outerwear',
      },
    ],
  },
];

const categories = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
];
const seasons = ['Summer', 'Winter', 'Fall', 'Spring'];

type Props = {
  navigation: any;
};

export default function WearHistoryScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState('Last 7 Days');
  const [_selectedDate, _setSelectedDate] = useState<string | null>(null);
  const [selectedLog, _setSelectedLog] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate stats
  const totalLogs = wearHistoryData.length;
  const mostWornItem = () => {
    let maxWear = 0;
    let mostWorn = '';
    wearHistoryData.forEach(log => {
      log.items.forEach(item => {
        if (item.wearCount > maxWear) {
          maxWear = item.wearCount;
          mostWorn = item.name;
        }
      });
    });
    return { name: mostWorn, count: maxWear };
  };
  const leastWornItem = () => {
    let minWear = Infinity;
    let leastWorn = '';
    wearHistoryData.forEach(log => {
      log.items.forEach(item => {
        if (item.wearCount < minWear) {
          minWear = item.wearCount;
          leastWorn = item.name;
        }
      });
    });
    return { name: leastWorn, count: minWear };
  };

  const mostWorn = mostWornItem();
  const leastWorn = leastWornItem();

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleSeason = (season: string) => {
    if (selectedSeasons.includes(season)) {
      setSelectedSeasons(selectedSeasons.filter(s => s !== season));
    } else {
      setSelectedSeasons([...selectedSeasons, season]);
    }
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSeasons([]);
    setSelectedBrand('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleLogPress = (log: any) => {
    navigation.navigate('WearLogDetail', {
      logId: log.id,
      date: log.date,
      items: log.items,
    });
  };

  const handleEditLog = () => {
    setShowDetailModal(false);
    Alert.alert('Edit Log', 'Navigate to edit log screen');
  };

  const handleDeleteLog = () => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this wear log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setShowDetailModal(false),
        },
      ],
    );
  };

  const renderWearLogItem = ({
    item,
  }: {
    item: (typeof wearHistoryData)[0];
  }) => (
    <TouchableOpacity
      style={styles.logCard}
      onPress={() => handleLogPress(item)}
    >
      <Text style={styles.logDate}>{item.date}</Text>
      <View style={styles.logItems}>
        {item.items.map((clothing, index) => (
          <Text key={index} style={styles.logItem}>
            {clothing.name}
            {index < item.items.length - 1 ? ', ' : ''}
          </Text>
        ))}
      </View>
      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={() => handleLogPress(item)}
      >
        <Text style={styles.viewDetailsText}>View Details &gt;</Text>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Wear History</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Icon name="filter-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterChips}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === 'Last 7 Days' && styles.chipActive,
          ]}
          onPress={() => setActiveFilter('Last 7 Days')}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === 'Last 7 Days' && styles.chipTextActive,
            ]}
          >
            Last 7 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === 'Last 30 Days' && styles.chipActive,
          ]}
          onPress={() => setActiveFilter('Last 30 Days')}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === 'Last 30 Days' && styles.chipTextActive,
            ]}
          >
            Last 30 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, activeFilter === 'Custom' && styles.chipActive]}
          onPress={() => setActiveFilter('Custom')}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === 'Custom' && styles.chipTextActive,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalLogs}</Text>
          <Text style={styles.statLabel}>Total Logs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mostWorn.count}x</Text>
          <Text style={styles.statLabel}>Most Worn: {mostWorn.name}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{leastWorn.count}x</Text>
          <Text style={styles.statLabel}>Least Worn: {leastWorn.name}</Text>
        </View>
      </View>

      {/* Wear History List */}
      <FlatList
        data={wearHistoryData}
        renderItem={renderWearLogItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Wear History</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Range */}
              <Text style={styles.filterSectionTitle}>Date Range:</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    activeFilter === 'Last 7 Days' && styles.chipActive,
                  ]}
                  onPress={() => setActiveFilter('Last 7 Days')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === 'Last 7 Days' && styles.chipTextActive,
                    ]}
                  >
                    Last 7 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    activeFilter === 'Last 30 Days' && styles.chipActive,
                  ]}
                  onPress={() => setActiveFilter('Last 30 Days')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === 'Last 30 Days' && styles.chipTextActive,
                    ]}
                  >
                    Last 30 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    activeFilter === 'Custom' && styles.chipActive,
                  ]}
                  onPress={() => setActiveFilter('Custom')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === 'Custom' && styles.chipTextActive,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {activeFilter === 'Custom' && (
                <View style={styles.customDateContainer}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="Start Date (YYYY-MM-DD)"
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                  />
                  <TextInput
                    style={styles.dateInput}
                    placeholder="End Date (YYYY-MM-DD)"
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                  />
                </View>
              )}

              {/* Category Filter */}
              <Text style={styles.filterSectionTitle}>Category:</Text>
              <View style={styles.filterRow}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      selectedCategories.includes(cat) && styles.chipActive,
                    ]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategories.includes(cat) &&
                          styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Brand Filter */}
              <Text style={styles.filterSectionTitle}>Brand:</Text>
              <TouchableOpacity style={styles.brandSelector}>
                <Text style={styles.brandSelectorText}>
                  {selectedBrand || 'Select Brand...'}
                </Text>
                <Icon
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Season Filter */}
              <Text style={styles.filterSectionTitle}>Season:</Text>
              <View style={styles.filterRow}>
                {seasons.map(season => (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.filterChip,
                      selectedSeasons.includes(season) && styles.chipActive,
                    ]}
                    onPress={() => toggleSeason(season)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSeasons.includes(season) &&
                          styles.chipTextActive,
                      ]}
                    >
                      {season}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedLog?.date}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedLog?.items.map((item: any, index: number) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.detailItemName}>{item.name}</Text>
                  {item.brand && (
                    <Text style={styles.detailItemBrand}>
                      Brand: {item.brand}
                    </Text>
                  )}
                  <Text style={styles.detailItemWorn}>
                    Worn: {item.wearCount} times
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditLog}
              >
                <Icon name="create-outline" size={20} color={colors.white} />
                <Text style={styles.editButtonText}>Edit Log</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteLog}
              >
                <Icon name="trash-outline" size={20} color={colors.error} />
                <Text style={styles.deleteButtonText}>Delete Log</Text>
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
  filterButton: {
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  logDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  logItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  logItem: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  viewDetailsButton: {
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
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
    maxHeight: '80%',
    padding: 20,
  },
  detailModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  customDateContainer: {
    marginTop: 12,
    gap: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  brandSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  brandSelectorText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  detailItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  detailItemBrand: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailItemWorn: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  detailFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  editButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '500',
  },
});
