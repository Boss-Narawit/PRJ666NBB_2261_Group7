import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import { getClothing, updateClothing, Clothing } from '../services/api';
import { CLOTHING_CATEGORIES } from '../constants/categories';

// Chip labels are capitalized for display; backend categories are lowercase,
// so all category comparisons below are case-insensitive.
const categories = ['All', ...CLOTHING_CATEGORIES];

function wearCountOf(item: Clothing) {
  return item.analytics?.wearCount ?? 0;
}

type Props = {
  navigation: any;
  route?: any;
};

export default function WardrobeScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    route?.params?.category ?? 'All',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Apply the category passed from the home screen's category cards. Watching
  // the params *object* (a new reference on every navigate) rather than the
  // category value handles re-tapping the same card after the user changed the
  // filter locally — the value alone wouldn't re-fire the effect.
  useEffect(() => {
    if (route?.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route?.params]);

  // Refetches on focus — the wardrobe changes after adding/editing items
  // elsewhere; reload also runs after an archive action.
  const fetchWardrobe = useCallback((t: string) => getClothing(t), []);
  const {
    data: items,
    isLoading,
    isRefreshing,
    error,
    reload,
    refresh,
  } = useFocusedFetch(token, fetchWardrobe, 'Failed to load wardrobe.', []);

  // Archive (BR23) instead of deleting — preserves wear-log history. Archived
  // items are hidden from the wardrobe below; refetch on success surfaces that.
  // (Defined before openItemMenu — its useCallback deps reference this.)
  const confirmArchive = useCallback(
    (item: Clothing) => {
      Alert.alert(
        'Archive Item',
        `Archive "${item.name}"? It will be hidden from your wardrobe but its history is kept.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: async () => {
              if (!token) return;
              try {
                await updateClothing(token, item._id, { status: 'Archived' });
              } catch (err: any) {
                Alert.alert(
                  'Archive Item',
                  err.message || 'Could not archive item.',
                );
                return;
              }
              reload();
            },
          },
        ],
      );
    },
    [token, reload],
  );

  // Overflow "⋮" menu for a wardrobe item: view details or archive.
  const openItemMenu = useCallback(
    (item: Clothing) => {
      Alert.alert(item.name, undefined, [
        {
          text: 'View Details',
          onPress: () =>
            navigation.navigate('ItemDetail', { itemId: item._id }),
        },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => confirmArchive(item),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [navigation, confirmArchive],
  );

  // Only active-wardrobe items show here — Archived (BR23) and Exported items
  // have left the wardrobe (exported items live under Export History).
  const activeItems = items.filter(item => item.status === 'Available');

  // Filter items based on search and category (category compare is case-insensitive)
  const filteredItems = activeItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Recent items — newest first by createdAt, over a copy so the main
  // grid/list below stays in the backend's original (unsorted) order. Items
  // missing createdAt sort as oldest rather than crashing the comparator.
  const recentItems = [...activeItems]
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, 5);

  // Only show the empty state once the fetch settles — otherwise it flashes
  // alongside the loading spinner on first paint.
  const emptyState =
    !isLoading && !error ? (
      <View style={styles.emptyContainer}>
        <Icon name="shirt-outline" size={60} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No items found</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('AddCloth')}
        >
          <Text style={styles.emptyButtonText}>Add Your First Item</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  // Renderers are memoized so FlatList rows don't all re-render when
  // unrelated state (search text, modals) changes the parent.
  const renderGridItem = useCallback(
    ({ item }: { item: Clothing }) => (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
      >
        <View style={styles.gridImage}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          ) : (
            <Icon name="shirt-outline" size={40} color={colors.textSecondary} />
          )}
        </View>
        <Text style={styles.gridItemName}>{item.name}</Text>
        <Text style={styles.gridItemBrand}>{item.brand}</Text>
        <Text style={styles.gridItemWearCount}>
          Worn {wearCountOf(item)} times
        </Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderListItem = useCallback(
    ({ item }: { item: Clothing }) => (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
      >
        <View style={styles.listImage}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          ) : (
            <Icon name="shirt-outline" size={30} color={colors.textSecondary} />
          )}
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listItemName}>{item.name}</Text>
          <Text style={styles.listItemBrand}>{item.brand}</Text>
          <Text style={styles.listItemDetails}>
            {item.category} • {item.colors?.[0] ?? '—'} • Worn{' '}
            {wearCountOf(item)} times
          </Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => openItemMenu(item)}
        >
          <Icon
            name="ellipsis-vertical"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [navigation, openItemMenu],
  );

  const renderRecentItem = useCallback(
    ({ item }: { item: Clothing }) => (
      <TouchableOpacity
        style={styles.recentCard}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
      >
        <View style={styles.recentImage}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          ) : (
            <Icon name="shirt-outline" size={24} color={colors.textSecondary} />
          )}
        </View>
        <Text style={styles.recentItemName}>{item.name}</Text>
        <Text style={styles.recentItemWearCount}>
          Worn {wearCountOf(item)} times
        </Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    // The FAB lives outside the ScrollView — inside it, absolute positioning
    // anchors to the scrolled content, so the button scrolled with the page.
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wardrobe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('BatchAdd')}
            style={styles.addButton}
          >
            <Icon name="albums-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddCloth')}
            style={styles.addButton}
          >
            <Icon name="add-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon
            name="search-outline"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or brand..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loading}
          />
        )}
        {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}

        {/* Recent Items Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
          </View>
          <FlatList
            data={recentItems}
            renderItem={renderRecentItem}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          />
        </View>

        {/* All Items Section */}
        <View style={styles.allItemsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Items</Text>
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Icon
                name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {viewMode === 'grid' ? (
            <FlatList
              key="grid"
              data={filteredItems}
              renderItem={renderGridItem}
              keyExtractor={item => item._id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              scrollEnabled={false}
              ListEmptyComponent={emptyState}
            />
          ) : (
            <FlatList
              key="list"
              data={filteredItems}
              renderItem={renderListItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              ListEmptyComponent={emptyState}
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add New Cloth Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCloth')}
      >
        <Icon name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
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
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recentList: {
    paddingLeft: 16,
    gap: 12,
  },
  recentCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 12,
  },
  recentImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  recentItemName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  recentItemWearCount: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  allItemsSection: {
    marginBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  gridImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  gridItemBrand: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gridItemWearCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  listImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  listItemBrand: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listItemDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  moreButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 80,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  loading: {
    marginVertical: 24,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
