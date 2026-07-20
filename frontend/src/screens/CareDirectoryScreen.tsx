import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useFocusedFetch } from '../hooks/useFocusedFetch';
import { listPartners, Partner } from '../services/api';

type Props = {
  navigation: any;
};

// Referral directory of local tailors and upcycling shops — shown when an item
// needs repair rather than export (repair_reminder tap-through + the Damaged
// banner on ItemDetail). Data is the seeded partner list (manual mock data).
export default function CareDirectoryScreen({ navigation }: Props) {
  const { token } = useAuth();
  // Only care partners belong here; resale/donation live in the Export flow.
  const fetchPartners = useCallback(
    (t: string) =>
      listPartners(t).then(data =>
        data.filter(p => p.type === 'tailor' || p.type === 'upcycle'),
      ),
    [],
  );
  const {
    data: partners,
    isLoading,
    error,
  } = useFocusedFetch(
    token,
    fetchPartners,
    'Failed to load the directory.',
    [],
  );

  const renderPartner = ({ item }: { item: Partner }) => (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Icon
          name={item.type === 'tailor' ? 'cut-outline' : 'leaf-outline'}
          size={24}
          color={colors.primary}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'tailor' ? 'Tailor' : 'Upcycle'}
            </Text>
          </View>
        </View>
        {item.location ? (
          <Text style={styles.location}>
            <Icon
              name="location-outline"
              size={12}
              color={colors.textSecondary}
            />{' '}
            {item.location}
          </Text>
        ) : null}
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        {item.website ? (
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => Linking.openURL(item.website!)}
          >
            <Icon name="globe-outline" size={14} color={colors.primary} />
            <Text style={styles.websiteText}>Visit website</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Repair & Upcycle</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={partners}
          renderItem={renderPartner}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            partners.length > 0 ? (
              <Text style={styles.subtitle}>
                Local tailors and upcycling shops that can give a damaged item a
                second life.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="construct-outline"
                size={60}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No repair partners yet.</Text>
            </View>
          }
        />
      )}
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
  headerRightSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  websiteText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  loading: { marginTop: 24 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
