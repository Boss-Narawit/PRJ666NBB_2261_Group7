import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getExportHistory, ExportRecord } from '../services/api';

type Props = {
  navigation: any;
};

const toTitle = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export default function ExportHistoryScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getExportHistory(token);
      setRecords(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load export history.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Tapping opens the item's (now read-only) detail. A hard-deleted item has a
  // null clothingId — render it as a dead row rather than navigating nowhere.
  const renderRecord = ({ item }: { item: ExportRecord }) => (
    <TouchableOpacity
      style={styles.card}
      disabled={!item.clothingId?._id}
      onPress={() =>
        navigation.navigate('ItemDetail', { itemId: item.clothingId._id })
      }
    >
      <View style={styles.image}>
        {item.clothingId?.imageUrl ? (
          <Image
            source={{ uri: item.clothingId.imageUrl }}
            style={styles.thumbnail}
          />
        ) : (
          <Icon name="shirt-outline" size={28} color={colors.textSecondary} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {item.clothingId?.name ?? 'Item no longer in wardrobe'}
        </Text>
        <Text style={styles.destination}>
          → {item.partnerId?.name ?? 'Unknown partner'}
        </Text>
        <Text style={styles.meta}>
          {toTitle(item.type)} · {item.createdAt.slice(0, 10)}
        </Text>
      </View>
      {item.clothingId?._id && (
        <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
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
        <Text style={styles.headerTitle}>Export History</Text>
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
          data={records}
          renderItem={renderRecord}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="cube-outline"
                size={60}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No exported items yet.</Text>
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  destination: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
