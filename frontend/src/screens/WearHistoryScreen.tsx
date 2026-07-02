import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getWearLogs, WearLog } from '../services/api';
import { CLOTHING_CATEGORIES } from '../constants/categories';

// Display shape the list/stats/detail UI consumes, mapped from the API's
// populated WearLog documents.
type DisplayItem = {
  name: string;
  brand: string;
  wearCount: number;
  category: string;
  image?: string;
};
type DisplayLog = {
  id: string;
  date: string;
  items: DisplayItem[];
};

function toDisplayLog(log: WearLog): DisplayLog {
  return {
    id: log._id,
    date: log.logDate.slice(0, 10),
    items: log.clothingWorn
      .filter(c => c.itemId) // populated ref is null if the item was deleted
      .map(c => ({
        name: c.itemId!.name,
        brand: c.itemId!.brand,
        category: c.itemId!.category,
        wearCount: c.itemId!.analytics?.wearCount ?? 0,
        image: c.itemId!.imageUrl,
      })),
  };
}

// Shared list (includes 'Other') so every category stored on the backend is
// filterable here.
const categories = [...CLOTHING_CATEGORIES];

type DateRange = { startDate?: string; endDate?: string };

// Midnight-UTC calendar date `n` days before today, as YYYY-MM-DD — matches the
// backend's logDate storage so range comparisons line up.
function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

// Translate the active filter chip into the date range sent to the API. Custom
// only contributes the YYYY-MM-DD values the user actually entered.
function rangeForFilter(filter: string, start: string, end: string): DateRange {
  if (filter === 'Last 7 Days') return { startDate: isoDaysAgo(7) };
  if (filter === 'Last 30 Days') return { startDate: isoDaysAgo(30) };
  const r: DateRange = {};
  if (isYmd(start)) r.startDate = start;
  if (isYmd(end)) r.endDate = end;
  return r;
}

type Props = {
  navigation: any;
};

export default function WearHistoryScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [wearLogs, setWearLogs] = useState<WearLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('Last 7 Days');
  const [appliedRange, setAppliedRange] = useState<DateRange>(() => ({
    startDate: isoDaysAgo(7),
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Bumped on every fresh (page-1) fetch. An in-flight loadMore compares its
  // captured value on resolve and discards its page if the list was replaced
  // meanwhile — otherwise a slow "load more" appends a page of the *previous*
  // range onto the new list.
  const fetchVersionRef = useRef(0);

  const fetchLogs = useCallback(
    async (range: DateRange) => {
      if (!token) return;
      fetchVersionRef.current += 1;
      setIsLoading(true);
      try {
        const data = await getWearLogs(token, 1, range);
        setWearLogs(data.wearLogs);
        setPage(data.page);
        setTotal(data.total);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load wear history.');
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  // Refetch on focus (history changes after logging a wear elsewhere) and
  // whenever the applied date range changes — applying a filter just updates
  // appliedRange, which re-runs this single fetch.
  useFocusEffect(
    useCallback(() => {
      fetchLogs(appliedRange);
    }, [fetchLogs, appliedRange]),
  );

  const loadMore = async () => {
    if (!token || isLoadingMore || isLoading) return;
    if (wearLogs.length >= total) return;
    const version = fetchVersionRef.current;
    setIsLoadingMore(true);
    try {
      const data = await getWearLogs(token, page + 1, appliedRange);
      // The range changed (or the list was refetched) while this page was in
      // flight — appending it would mix ranges and corrupt page/total.
      if (version !== fetchVersionRef.current) return;
      setWearLogs(prev => [...prev, ...data.wearLogs]);
      setPage(data.page);
      setTotal(data.total);
    } catch {
      // Stay quiet if the range changed mid-flight — a success would have been
      // discarded too, so the failure is equally irrelevant to the user.
      if (version === fetchVersionRef.current) {
        Alert.alert(
          'Wear History',
          'Could not load more logs. Please try again.',
        );
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Brands present in the loaded pages — the brand filter only offers values
  // that actually appear, derived from the same data the list renders.
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    wearLogs.forEach(log =>
      log.clothingWorn.forEach(c => {
        if (c.itemId?.brand) set.add(c.itemId.brand);
      }),
    );
    return Array.from(set).sort();
  }, [wearLogs]);

  // Category and brand are filtered client-side over the loaded pages
  // (case-insensitive — the API returns lowercase category enums against the
  // title-case chips). Date range is server-side via appliedRange.
  const logs = useMemo(() => {
    const wanted = selectedCategories.map(c => c.toLowerCase());
    return wearLogs.map(toDisplayLog).filter(log => {
      const matchesCategory =
        wanted.length === 0 ||
        log.items.some(i => wanted.includes(i.category.toLowerCase()));
      const matchesBrand =
        !selectedBrand || log.items.some(i => i.brand === selectedBrand);
      return matchesCategory && matchesBrand;
    });
  }, [wearLogs, selectedCategories, selectedBrand]);

  // Total Logs reflects the server-side count for the active range. With a
  // (client-side) category or brand filter active there is no server count for
  // it, so fall back to the visible matched count to avoid contradicting the list.
  const totalLogs =
    selectedCategories.length > 0 || selectedBrand ? logs.length : total;
  const mostWornItem = () => {
    let maxWear = 0;
    let mostWorn = '';
    logs.forEach(log => {
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
    logs.forEach(log => {
      log.items.forEach(item => {
        if (item.wearCount < minWear) {
          minWear = item.wearCount;
          leastWorn = item.name;
        }
      });
    });
    return { name: leastWorn, count: minWear === Infinity ? 0 : minWear };
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

  // Quick-chip tap: switch the active range and let appliedRange drive the
  // refetch. The Custom chip opens the filter modal instead — its date inputs
  // live there, and applying an empty custom range would mean "all time".
  const applyFilter = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'Custom') {
      setShowFilters(true);
      return;
    }
    setAppliedRange(rangeForFilter(filter, customStartDate, customEndDate));
  };

  // Modal "Apply Filters": commit the active range (incl. custom dates) and close.
  // Category is client-side, so it needs no refetch.
  const applyModalFilters = () => {
    setAppliedRange(
      rangeForFilter(activeFilter, customStartDate, customEndDate),
    );
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrand('');
    setCustomStartDate('');
    setCustomEndDate('');
    setActiveFilter('Last 7 Days');
    setAppliedRange({ startDate: isoDaysAgo(7) });
  };

  const handleLogPress = (log: any) => {
    navigation.navigate('WearLogDetail', {
      logId: log.id,
      date: log.date,
      items: log.items,
    });
  };

  const renderWearLogItem = ({ item }: { item: DisplayLog }) => (
    <TouchableOpacity
      style={styles.logCard}
      onPress={() => handleLogPress(item)}
    >
      <Text style={styles.logDate}>{item.date}</Text>
      <View style={styles.logItems}>
        {item.items.length === 0 ? (
          // Every item on this log was deleted from the wardrobe (its populated
          // refs came back null) — show a placeholder instead of a blank row.
          <Text style={styles.logItemDeleted}>Item no longer in wardrobe</Text>
        ) : (
          item.items.map((clothing, index) => (
            <Text key={index} style={styles.logItem}>
              {clothing.name}
              {index < item.items.length - 1 ? ', ' : ''}
            </Text>
          ))
        )}
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
          onPress={() => applyFilter('Last 7 Days')}
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
          onPress={() => applyFilter('Last 30 Days')}
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
          onPress={() => applyFilter('Custom')}
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
      {isLoading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      )}
      {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={logs}
        renderItem={renderWearLogItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          wearLogs.length < total ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.loadMoreText}>Load More</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.emptyContainer}>
              <Icon
                name="time-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                {selectedCategories.length > 0 && wearLogs.length > 0
                  ? wearLogs.length < total
                    ? 'No logs match this category on the loaded pages. Load more or clear the filter.'
                    : 'No logs match this category. Clear the filter to see all.'
                  : 'No wear logs yet'}
              </Text>
            </View>
          ) : null
        }
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

              {/* Brand Filter — derived from the brands present in loaded logs.
                  Tapping the active brand again clears it (single-select). */}
              <Text style={styles.filterSectionTitle}>Brand:</Text>
              {availableBrands.length === 0 ? (
                <Text style={styles.brandEmptyText}>
                  No brands in the loaded history.
                </Text>
              ) : (
                <View style={styles.filterRow}>
                  {availableBrands.map(brand => (
                    <TouchableOpacity
                      key={brand}
                      style={[
                        styles.filterChip,
                        selectedBrand === brand && styles.chipActive,
                      ]}
                      onPress={() =>
                        setSelectedBrand(prev => (prev === brand ? '' : brand))
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedBrand === brand && styles.chipTextActive,
                        ]}
                      >
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
                onPress={applyModalFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
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
  logItemDeleted: {
    fontSize: 14,
    fontStyle: 'italic',
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
  brandEmptyText: {
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
  loading: {
    marginVertical: 24,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
