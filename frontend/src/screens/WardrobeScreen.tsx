import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

// Mock data for wardrobe items
const wardrobeItems = [
  { id: '1', name: 'White Sneakers', brand: 'Nike', category: 'Shoes', wearCount: 24, image: null, color: 'White' },
  { id: '2', name: 'Winter Jacket', brand: 'North Face', category: 'Outerwear', wearCount: 30, image: null, color: 'Black' },
  { id: '3', name: 'Blue Shirts', brand: 'Uniqlo', category: 'Tops', wearCount: 24, image: null, color: 'Blue' },
  { id: '4', name: 'Black Jeans', brand: 'Levi\'s', category: 'Bottoms', wearCount: 15, image: null, color: 'Black' },
  { id: '5', name: 'Running Shoes', brand: 'Adidas', category: 'Shoes', wearCount: 42, image: null, color: 'White' },
  { id: '6', name: 'Denim Jacket', brand: 'Zara', category: 'Outerwear', wearCount: 8, image: null, color: 'Blue' },
  { id: '7', name: 'Floral Dress', brand: 'H&M', category: 'Dresses', wearCount: 5, image: null, color: 'Pink' },
  { id: '8', name: 'Grey Sweater', brand: 'Muji', category: 'Tops', wearCount: 12, image: null, color: 'Grey' },
  { id: '9', name: 'Leather Boots', brand: 'Dr. Martens', category: 'Shoes', wearCount: 18, image: null, color: 'Brown' },
  { id: '10', name: 'Cargo Pants', brand: 'Carhartt', category: 'Bottoms', wearCount: 6, image: null, color: 'Olive' },
];

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];

type Props = {
  navigation: any;
};

export default function WardrobeScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter items based on search and category
  const filteredItems = wardrobeItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Recent items (last 5 added or most worn - using mock data)
  const recentItems = wardrobeItems.slice(0, 5);

  const renderGridItem = ({ item }: { item: typeof wardrobeItems[0] }) => (
    <TouchableOpacity style={styles.gridCard}>
      <View style={styles.gridImage}>
        <Icon name="shirt-outline" size={40} color={colors.textSecondary} />
      </View>
      <Text style={styles.gridItemName}>{item.name}</Text>
      <Text style={styles.gridItemBrand}>{item.brand}</Text>
      <Text style={styles.gridItemWearCount}>Worn {item.wearCount} times</Text>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: typeof wardrobeItems[0] }) => (
    <TouchableOpacity style={styles.listCard}>
      <View style={styles.listImage}>
        <Icon name="shirt-outline" size={30} color={colors.textSecondary} />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listItemName}>{item.name}</Text>
        <Text style={styles.listItemBrand}>{item.brand}</Text>
        <Text style={styles.listItemDetails}>
          {item.category} • {item.color} • Worn {item.wearCount} times
        </Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Icon name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: typeof wardrobeItems[0] }) => (
    <TouchableOpacity style={styles.recentCard}>
      <View style={styles.recentImage}>
        <Icon name="shirt-outline" size={24} color={colors.textSecondary} />
      </View>
      <Text style={styles.recentItemName}>{item.name}</Text>
      <Text style={styles.recentItemWearCount}>Worn {item.wearCount} times</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wardrobe</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddCloth')} style={styles.addButton}>
          <Icon name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
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
        {categories.map((cat) => (
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

      {/* Recent Items Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Items</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentItems}
          renderItem={renderRecentItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        />
      </View>

      {/* All Items Section */}
      <View style={styles.allItemsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Items</Text>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
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
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            scrollEnabled={false}
            ListEmptyComponent={
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
            }
          />
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
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
            }
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
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
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
});