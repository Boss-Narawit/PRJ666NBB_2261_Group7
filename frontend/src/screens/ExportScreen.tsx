import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getClothing, listPartners, Clothing, Partner } from '../services/api';

type Props = {
  navigation: any;
  route?: { params?: { item?: Clothing } };
};

export default function ExportScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const preItem = route?.params?.item;
  const [selectedTab, setSelectedTab] = useState<'resale' | 'donation'>(
    'resale',
  );
  const [clothing, setClothing] = useState<Clothing[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    preItem ? [preItem._id] : [],
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null,
  );
  // Fetch failures must be distinguishable from genuinely-empty lists — a dead
  // backend used to render as "No items available to export." Loading is a
  // third state: without it the empty-list copy flashes during the fetch.
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  // Only Available items can be exported (BR23 keeps archived out).
  useEffect(() => {
    if (!token) return;
    setItemsError(null);
    getClothing(token)
      .then(data => setClothing(data.filter(c => c.status === 'Available')))
      .catch(err => {
        setClothing([]);
        setItemsError(err.message || 'Could not load your wardrobe.');
      })
      .finally(() => setItemsLoading(false));
  }, [token]);

  // Partners are filtered by destination type; reset the pick when the tab flips.
  useEffect(() => {
    if (!token) return;
    setSelectedPartnerId(null);
    setPartnersError(null);
    setPartnersLoading(true);
    listPartners(token, selectedTab)
      .then(setPartners)
      .catch(err => {
        setPartners([]);
        setPartnersError(err.message || 'Could not load partners.');
      })
      .finally(() => setPartnersLoading(false));
  }, [token, selectedTab]);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId],
    );
  };

  const renderItem = ({ item }: { item: Clothing }) => (
    <TouchableOpacity
      style={[
        styles.itemCard,
        selectedItems.includes(item._id) && styles.itemCardSelected,
      ]}
      onPress={() => toggleItemSelection(item._id)}
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
        <Text style={styles.itemBrand}>{item.brand}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
      {selectedItems.includes(item._id) && (
        <View style={styles.checkmark}>
          <Icon name="checkmark-circle" size={24} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPlatform = ({ item }: { item: Partner }) => (
    <TouchableOpacity
      style={[
        styles.platformCard,
        selectedPartnerId === item._id && styles.platformCardSelected,
      ]}
      onPress={() => setSelectedPartnerId(item._id)}
    >
      <View style={styles.platformRadio}>
        {selectedPartnerId === item._id ? (
          <View style={styles.radioSelected} />
        ) : null}
      </View>
      <Text style={styles.platformName}>{item.name}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Export Items</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'resale' && styles.tabActive]}
            onPress={() => setSelectedTab('resale')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'resale' && styles.tabTextActive,
              ]}
            >
              Resale
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'donation' && styles.tabActive]}
            onPress={() => setSelectedTab('donation')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'donation' && styles.tabTextActive,
              ]}
            >
              Donation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Select Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Items to Export</Text>
          <FlatList
            data={clothing}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text
                style={[styles.emptyText, !!itemsError && styles.errorText]}
              >
                {itemsLoading
                  ? 'Loading your wardrobe…'
                  : (itemsError ?? 'No items available to export.')}
              </Text>
            }
          />
        </View>

        {/* Choose Destination Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Choose {selectedTab === 'resale' ? 'Platform' : 'Donation Center'}
          </Text>
          <FlatList
            data={partners}
            renderItem={renderPlatform}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text
                style={[styles.emptyText, !!partnersError && styles.errorText]}
              >
                {partnersLoading
                  ? 'Loading partners…'
                  : (partnersError ?? `No ${selectedTab} partners available.`)}
              </Text>
            }
          />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            if (selectedItems.length === 0) {
              Alert.alert('Error', 'Please select at least one item');
              return;
            }
            if (!selectedPartnerId) {
              Alert.alert(
                'Error',
                `Please select a ${selectedTab} destination`,
              );
              return;
            }
            navigation.navigate('QualityChecklist', {
              items: selectedItems,
              type: selectedTab,
              destination: selectedPartnerId,
            });
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
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
  itemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
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
  itemBrand: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkmark: {
    marginLeft: 8,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  platformCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  platformRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  platformName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  nextButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  errorText: {
    color: '#e53e3e',
  },
});
