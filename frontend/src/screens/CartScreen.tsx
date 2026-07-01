import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  getPurchases,
  approvePurchase,
  rejectPurchase,
  ThoughtfulPurchase,
} from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#E69500',
  approved: '#2E7D32',
  rejected: '#C0392B',
};

function cooldownLabel(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'Cooling-off complete';
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h left`;
  return `${Math.ceil(hours / 24)}d left`;
}

export default function CartScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const [purchases, setPurchases] = useState<ThoughtfulPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getPurchases(token);
      setPurchases(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load your cart.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleApprove = async (item: ThoughtfulPurchase) => {
    if (!token) return;
    try {
      const updated = await approvePurchase(token, item._id);
      setPurchases(prev => prev.map(p => (p._id === item._id ? updated : p)));
      // Send the buyer to the wardrobe Add form, prefilled with what we already
      // know; they fill in brand/category/size/color and a photo (BR4 requires
      // one — AddCloth enforces it at save), then save it to the wardrobe.
      navigation.navigate('AddCloth', {
        prefill: {
          name: item.itemName,
          imageUrl: item.imageUrl,
        },
      });
    } catch (err: any) {
      Alert.alert('Could not approve', err.message || 'Something went wrong.');
    }
  };

  const handleReject = async (item: ThoughtfulPurchase) => {
    if (!token) return;
    try {
      const updated = await rejectPurchase(token, item._id);
      setPurchases(prev => prev.map(p => (p._id === item._id ? updated : p)));
    } catch (err: any) {
      Alert.alert('Could not reject', err.message || 'Something went wrong.');
    }
  };

  const renderItem = ({ item }: { item: ThoughtfulPurchase }) => {
    // BR15: confirming is only allowed once the cooling-off period has ended.
    const cooldownDone = new Date(item.cooldownEndsAt).getTime() <= Date.now();
    const isPending = item.status === 'pending';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.itemName}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: (STATUS_COLORS[item.status] ?? '#888') + '22',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: STATUS_COLORS[item.status] ?? '#888' },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
        {item.estimatedPrice != null && (
          <Text style={styles.cardPrice}>${item.estimatedPrice}</Text>
        )}
        {isPending && (
          <Text style={styles.cooldown}>
            <Icon name="time-outline" size={12} />{' '}
            {cooldownLabel(item.cooldownEndsAt)}
          </Text>
        )}
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.approveBtn,
                !cooldownDone && styles.actionBtnDisabled,
              ]}
              disabled={!cooldownDone}
              onPress={() => handleApprove(item)}
            >
              <Text style={styles.approveText}>
                {cooldownDone ? 'Buy it' : 'Locked'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleReject(item)}
            >
              <Text style={styles.rejectText}>Skip it</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thoughtful Cart</Text>
      <Text style={styles.subtitle}>
        Items in their cooling-off period. Confirm once the timer ends.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={purchases}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon
                name="cart-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                Nothing on hold. Start a cooling-off timer from the Thoughtful
                Purchasing tab.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardPrice: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  cooldown: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.5 },
  approveBtn: { backgroundColor: colors.primary },
  approveText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  rejectBtn: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  rejectText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  loading: { marginTop: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
