import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

// Mock data for clothing items
const clothingItems = [
  { id: '1', name: 'Black Hoodie', brand: 'Nike', category: 'Hoodie', image: null },
  { id: '2', name: 'Blue Jeans', brand: "Levi's", category: 'Bottoms', image: null },
  { id: '3', name: 'White Sneakers', brand: 'Adidas', category: 'Shoes', image: null },
  { id: '4', name: 'Floral Dress', brand: 'Zara', category: 'Dresses', image: null },
];

// Mock data for resale platforms
const resalePlatforms = [
  { id: '1', name: 'Platform 1' },
  { id: '2', name: 'Platform 2' },
  { id: '3', name: 'Platform 3' },
];

// Mock data for donation centers
const donationCenters = [
  { id: '1', name: 'Donation Centre 1' },
  { id: '2', name: 'Donation Centre 2' },
  { id: '3', name: 'Donation Centre 3' },
];

type Props = {
  navigation: any;
};

export default function ExportScreen({ navigation }: Props) {
  const [selectedTab, setSelectedTab] = useState<'resale' | 'donation'>('resale');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedResalePlatform, setSelectedResalePlatform] = useState<string | null>(null);
  const [selectedDonationCenter, setSelectedDonationCenter] = useState<string | null>(null);
  const [showQualityChecklist, setShowQualityChecklist] = useState(false);
  const [selectedItemForExport, setSelectedItemForExport] = useState<any>(null);

  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleExport = () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item to export');
      return;
    }

    const platform = selectedTab === 'resale' ? selectedResalePlatform : selectedDonationCenter;
    if (!platform) {
      Alert.alert('Error', `Please select a ${selectedTab} destination`);
      return;
    }

    // Navigate to quality checklist
    setShowQualityChecklist(true);
  };

  const handleConfirmExport = () => {
    Alert.alert(
      'Export Confirmed',
      `Your items have been exported for ${selectedTab}!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
    setShowQualityChecklist(false);
  };

  const renderItem = ({ item }: { item: typeof clothingItems[0] }) => (
    <TouchableOpacity
      style={[
        styles.itemCard,
        selectedItems.includes(item.id) && styles.itemCardSelected,
      ]}
      onPress={() => toggleItemSelection(item.id)}
    >
      <View style={styles.itemImage}>
        <Icon name="shirt-outline" size={30} color={colors.textSecondary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemBrand}>{item.brand}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
      {selectedItems.includes(item.id) && (
        <View style={styles.checkmark}>
          <Icon name="checkmark-circle" size={24} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPlatform = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.platformCard,
        (selectedTab === 'resale' && selectedResalePlatform === item.id) ||
        (selectedTab === 'donation' && selectedDonationCenter === item.id)
          ? styles.platformCardSelected
          : null,
      ]}
      onPress={() => {
        if (selectedTab === 'resale') {
          setSelectedResalePlatform(item.id);
        } else {
          setSelectedDonationCenter(item.id);
        }
      }}
    >
      <View style={styles.platformRadio}>
        {(selectedTab === 'resale' && selectedResalePlatform === item.id) ||
        (selectedTab === 'donation' && selectedDonationCenter === item.id) ? (
          <View style={styles.radioSelected} />
        ) : null}
      </View>
      <Text style={styles.platformName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Item</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'resale' && styles.tabActive]}
          onPress={() => setSelectedTab('resale')}
        >
          <Text style={[styles.tabText, selectedTab === 'resale' && styles.tabTextActive]}>
            Resale
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'donation' && styles.tabActive]}
          onPress={() => setSelectedTab('donation')}
        >
          <Text style={[styles.tabText, selectedTab === 'donation' && styles.tabTextActive]}>
            Donation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Select Items Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Items to Export</Text>
        <FlatList
          data={clothingItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Choose Destination Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Choose {selectedTab === 'resale' ? 'Platform' : 'Donation Center'}
        </Text>
        <FlatList
          data={selectedTab === 'resale' ? resalePlatforms : donationCenters}
          renderItem={renderPlatform}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
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
          if (selectedTab === 'resale' && !selectedResalePlatform) {
            Alert.alert('Error', 'Please select a resale platform');
            return;
          }
          if (selectedTab === 'donation' && !selectedDonationCenter) {
            Alert.alert('Error', 'Please select a donation center');
            return;
          }
          // Navigate to quality checklist instead of showing modal
          navigation.navigate('QualityChecklist', {
            items: selectedItems,
            type: selectedTab,
            destination: selectedTab === 'resale' ? selectedResalePlatform : selectedDonationCenter,
          });
        }}
      >
        <Text style={styles.nextButtonText}>Next</Text>
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
});