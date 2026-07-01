import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
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
  const [items, setItems] = useState<Clothing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    route?.params?.category ?? 'All',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Apply the category passed from the home screen's category cards. Watching
  // the param (not just initial state) handles navigating back here with a
  // different category while this screen instance is already in the stack.
  useEffect(() => {
    if (route?.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route?.params?.category]);

  // Guard against setState after the screen unmounts mid-fetch (load runs on
  // focus and after an archive action).
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getClothing(token);
      if (mountedRef.current) {
        setItems(data);
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current)
        setError(err.message || 'Failed to load wardrobe.');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [token]);

  // Refetch on focus — the wardrobe changes after adding/editing items elsewhere.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Overflow "⋮" menu for a wardrobe item: view details or archive.
  const openItemMenu = (item: Clothing) => {
    Alert.alert(item.name, undefined, [
      {
        text: 'View Details',
        onPress: () => navigation.navigate('ItemDetail', { itemId: item._id }),
      },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => confirmArchive(item),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Archive (BR23) instead of deleting — preserves wear-log history. Archived
  // items are hidden from the wardrobe below; refetch on success surfaces that.
  const confirmArchive = (item: Clothing) => {
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
            load();
          },
        },
      ],
    );
  };

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

  // Recent items (first 5 returned)
  const recentItems = activeItems.slice(0, 5);

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

  const renderGridItem = ({ item }: { item: Clothing }) => (
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
  );

  const renderListItem = ({ item }: { item: Clothing }) => (
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
          {item.category} • {item.colors?.[0] ?? '—'} • Worn {wearCountOf(item)}{' '}
          times
        </Text>
      </View>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => openItemMenu(item)}
      >
        <Icon name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: Clothing }) => (
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
        <Text style={styles.headerTitle}>My Wardrobe</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddCloth')}
          style={styles.addButton}
        >
          <Icon name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

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
            <Icon name="close-circle" size={20} color={colors.textSecondary} />
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
            data={filteredItems}
            renderItem={renderListItem}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            ListEmptyComponent={emptyState}
          />
        )}
      </View>

      {/* Add New Cloth Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCloth')}
      >
        <Icon name="add" size={28} color={colors.white} />
      </TouchableOpacity>

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
    padding: 8,
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
