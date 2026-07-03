import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  getDashboardSummary,
  createWearLog,
  DashboardSummary,
} from '../services/api';
import { FEATURED_CATEGORIES } from '../constants/categories';
import { localDateString } from '../utils/date';

function formatLastWorn(lastWornAt?: string) {
  return lastWornAt ? lastWornAt.slice(0, 10) : 'Never';
}

export default function MainScreen({ navigation }: any) {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getDashboardSummary(token);
      setSummary(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  // Refetch whenever the dashboard tab regains focus — stats change after
  // adding items or logging wears elsewhere in the app.
  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary]),
  );

  const handleWear = (item: any) => {
    if (!token) return;
    Alert.alert('Log Wear', `Log "${item.name}" as worn today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Wear',
        onPress: async () => {
          try {
            await createWearLog(token, {
              logDate: localDateString(),
              clothingWorn: [{ itemId: item._id }],
            });
          } catch (err: any) {
            Alert.alert('Log Wear', err.message || 'Could not log wear.');
            return;
          }
          Alert.alert('Success', `${item.name} logged as worn today!`);
          // Worn today → drops out of the forgotten preview on refetch.
          loadSummary();
        },
      },
    ]);
  };

  const renderCategoryItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('Wardrobe', { category: item.name })}
    >
      <View
        style={[
          styles.categoryIcon,
          { backgroundColor: colors.primary + '20' },
        ]}
      >
        <Image source={item.image} style={styles.categoryImage} />
      </View>
      <Text style={styles.categoryName}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderForgottenItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.forgottenCard}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
    >
      <View style={styles.forgottenImagePlaceholder}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.forgottenThumbnail}
          />
        ) : (
          <Icon name="shirt-outline" size={30} color={colors.textSecondary} />
        )}
      </View>
      <View style={styles.forgottenInfo}>
        <Text style={styles.forgottenName}>{item.name}</Text>
        <Text style={styles.forgottenBrand}>{item.brand}</Text>
        <Text style={styles.forgottenDate}>
          Last worn: {formatLastWorn(item.analytics?.lastWornAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.wearButton, { backgroundColor: colors.primary }]}
        onPress={() => handleWear(item)}
      >
        <Text style={styles.wearButtonText}>Wear</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            loadSummary();
          }}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <ImageBackground
        source={require('../assets/images/Banner.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.headerContent}>
          <Text style={[styles.logo, { color: colors.primary }]}>
            Hello, {summary?.userName ?? 'User'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Icon
              name="person-circle-outline"
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {isLoading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      )}
      {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.white }]}
          onPress={() => navigation.navigate('Wardrobe')}
        >
          <Text style={styles.statNumber}>{summary?.totalItems ?? '–'}</Text>
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            Total Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.white }]}
          onPress={() => navigation.navigate('WearLog')}
        >
          <Text style={styles.statNumber}>{summary?.wornThisMonth ?? '–'}</Text>
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            Worn This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.white }]}
          onPress={() => navigation.navigate('ForgottenItems')}
        >
          <Text style={styles.statNumber}>
            {summary?.forgottenCount ?? '–'}
          </Text>
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            Forgotten
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🎉 STYLE RECAP BANNER - ADDED HERE */}
      <TouchableOpacity 
        style={styles.recapBanner}
        onPress={() => navigation.navigate('StyleRecap')}
        activeOpacity={0.9}
      >
        <View style={styles.recapBannerContent}>
          <Text style={styles.recapBannerTitle}>🎉 2025 RECAP</Text>
          <Text style={styles.recapBannerSubtitle}>
            Your 2025 Style Recap is Here!
          </Text>
          <Text style={styles.recapBannerDescription}>
            Discover your most worn items, sustainability stats, and more.
          </Text>
          <View style={styles.recapBannerButton}>
            <Text style={styles.recapBannerButtonText}>View Your Recap →</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* My Wardrobe Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            My Wardrobe
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wardrobe')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={FEATURED_CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* View History Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            View History
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('WearLog')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.historyCard, { backgroundColor: colors.white }]}
          onPress={() => navigation.navigate('WearLog')}
        >
          <View
            style={[
              styles.historyIcon,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Icon name="time-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.historyContent}>
            <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
              Recent Outfits
            </Text>
            <Text
              style={[styles.historySubtitle, { color: colors.textSecondary }]}
            >
              Last 7 days
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* View Forgotten Items Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            View Forgotten Items
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgottenItems')}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        {summary && summary.forgottenItems.length === 0 ? (
          <Text style={styles.emptyText}>No forgotten items — well done!</Text>
        ) : (
          <FlatList
            data={summary?.forgottenItems ?? []}
            renderItem={renderForgottenItem}
            keyExtractor={item => item._id}
            scrollEnabled={false}
          />
        )}
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
    width: '100%',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    paddingVertical: 16,
    paddingHorizontal: 8,
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
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  // 🎉 STYLE RECAP BANNER STYLES - ADDED HERE
  recapBanner: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recapBannerContent: {
    flex: 1,
    gap: 4,
  },
  recapBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  recapBannerSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  recapBannerDescription: {
    fontSize: 12,
    color: colors.white + 'CC',
    marginTop: 2,
  },
  recapBannerButton: {
    backgroundColor: colors.white + '25',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  recapBannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
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
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  forgottenThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
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
  bottomPadding: {
    height: 40,
  },
  loading: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
});