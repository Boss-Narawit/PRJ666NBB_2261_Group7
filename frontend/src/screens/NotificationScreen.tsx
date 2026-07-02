import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  AppNotification,
} from '../services/api';

const TYPE_ICONS: Record<string, string> = {
  forgotten_item: 'shirt-outline',
  cooldown_reminder: 'time-outline',
  similarity_alert: 'alert-circle-outline',
  recap_ready: 'sparkles-outline',
  export_update: 'cube-outline',
};

function timeAgo(createdAt: string) {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60000,
  );
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getNotifications(token);
      setNotifications(data.notifications);
      setPage(data.page);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  const loadMore = async () => {
    if (!token || isLoadingMore || isRefreshing) return;
    if (notifications.length >= total) return;
    setIsLoadingMore(true);
    try {
      const data = await getNotifications(token, page + 1);
      setNotifications(prev => [...prev, ...data.notifications]);
      setPage(data.page);
      setTotal(data.total);
    } catch {
      Alert.alert(
        'Notifications',
        'Could not load more notifications. Please try again.',
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handlePress = async (item: AppNotification) => {
    // Open the full-detail card with the read state as-is at tap time.
    setSelected(item);
    if (item.isRead || !token) return;
    // Optimistic flip; reload on failure to stay in sync with the server.
    setNotifications(prev =>
      prev.map(n => (n._id === item._id ? { ...n, isRead: true } : n)),
    );
    try {
      await markNotificationRead(token, item._id);
    } catch {
      load();
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconCircle}>
        <Icon
          name={TYPE_ICONS[item.type] ?? 'notifications-outline'}
          size={22}
          color={colors.primary}
        />
      </View>
      <View style={styles.cardBody}>
        <Text
          style={[styles.message, !item.isRead && styles.unreadMessage]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.footerLoading}
            />
          ) : null
        }
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
          <View style={styles.centered}>
            <Icon
              name="notifications-off-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
          {/* Stop propagation so taps inside the card don't dismiss it. */}
          <Pressable style={styles.detailCard} onPress={() => {}}>
            <View style={styles.detailHeader}>
              <View style={styles.iconCircle}>
                <Icon
                  name={
                    (selected && TYPE_ICONS[selected.type]) ??
                    'notifications-outline'
                  }
                  size={22}
                  color={colors.primary}
                />
              </View>
              <TouchableOpacity
                onPress={() => setSelected(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.detailScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.detailMessage}>{selected?.message}</Text>
            </ScrollView>
            {selected && (
              <Text style={styles.detailTime}>
                {timeAgo(selected.createdAt)}
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
    letterSpacing: -0.5, // Sleek letter spacing for the title
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#FFEBF6', // Opaque solid color to fix Android shadow rendering bug (removes ugly gray halo border)
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 18,
    letterSpacing: 0.1, // Adjusted letter spacing for improved readability
  },
  unreadMessage: {
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.1, // Matching letter spacing
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  footerLoading: {
    paddingVertical: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailScroll: {
    flexShrink: 1,
  },
  detailMessage: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  detailTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
    letterSpacing: 0.1,
  },
});
