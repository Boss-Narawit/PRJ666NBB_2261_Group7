import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

// Mock data for categories
const categories = [
  { id: '1', name: 'Jacket', icon: 'shirt-outline' },
  { id: '2', name: 'Shirts', icon: 'shirt-outline' },
  { id: '3', name: 'Pants', icon: 'shirt-outline' },
  { id: '4', name: 'Shoes', icon: 'footsteps-outline' },
];

// Mock data for forgotten items
const forgottenItems = [
  { id: '1', name: 'Blue Jeans', brand: 'Calvin Klein', lastWorn: '2026-01-29' },
  { id: '2', name: 'Flower Sweater', brand: 'Muji', lastWorn: '2026-01-29' },
  { id: '3', name: 'Leopard Sneakers', brand: 'Sneaker Co', lastWorn: '2026-01-29' },
];

export default function MainScreen({ navigation }: any) {
  const renderCategoryItem = ({ item }: any) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
        <Icon name={item.icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderForgottenItem = ({ item }: any) => (
    <TouchableOpacity style={styles.forgottenCard}>
      <View style={styles.forgottenImagePlaceholder}>
        <Icon name="shirt-outline" size={30} color={colors.textSecondary} />
      </View>
      <View style={styles.forgottenInfo}>
        <Text style={styles.forgottenName}>{item.name}</Text>
        <Text style={styles.forgottenBrand}>{item.brand}</Text>
        <Text style={styles.forgottenDate}>Last worn: {item.lastWorn}</Text>
      </View>
      <TouchableOpacity style={[styles.wearButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.wearButtonText}>Wear</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.primary }]}>Hello, User</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="person-circle-outline" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.white }]}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.white }]}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Worn This Month</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.white }]}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Forgotten</Text>
        </View>
      </View>

      {/* My Wardrobe Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Wardrobe</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wardrobe')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* View History Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>View History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WearLog')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.historyCard, { backgroundColor: colors.white }]}>
          <View style={[styles.historyIcon, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="time-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.historyContent}>
            <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>Recent Outfits</Text>
            <Text style={[styles.historySubtitle, { color: colors.textSecondary }]}>Last 7 days</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* View Forgotten Items Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>View Forgotten Items</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ForgottenItems')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={forgottenItems}
          renderItem={renderForgottenItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  historySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  forgottenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  forgottenImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  forgottenInfo: {
    flex: 1,
  },
  forgottenName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  forgottenBrand: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  forgottenDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  wearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  wearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});