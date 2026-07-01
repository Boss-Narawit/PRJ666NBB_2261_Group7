import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { deleteWearLog } from '../services/api';

type Props = {
  navigation: any;
  route: {
    params: {
      logId: string;
      date: string;
      items: {
        name: string;
        brand?: string;
        wearCount: number;
        image?: string;
      }[];
    };
  };
};

export default function WearLogDetailScreen({ navigation, route }: Props) {
  const { logId, date, items } = route.params;
  const { token } = useAuth();
  const [deleting, setDeleting] = React.useState(false);

  const handleEditLog = () => {
    navigation.navigate('EditWearLog', { logId });
  };

  const handleDeleteLog = () => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this wear log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setDeleting(true);
            try {
              await deleteWearLog(token, logId);
              navigation.goBack();
            } catch (err: any) {
              setDeleting(false);
              Alert.alert('Error', err.message || 'Failed to delete wear log');
            }
          },
        },
      ],
    );
  };

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
        <Text style={styles.headerTitle}>Wear Log Detail</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Date Section */}
      <View style={styles.dateSection}>
        <Icon name="calendar-outline" size={24} color={colors.primary} />
        <Text style={styles.dateText}>{date}</Text>
      </View>

      {/* Items List */}
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>Items Worn</Text>

        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemImage}>
              <Icon
                name="shirt-outline"
                size={30}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.brand && (
                <Text style={styles.itemBrand}>Brand: {item.brand}</Text>
              )}
              <Text style={styles.itemWorn}>Worn: {item.wearCount} times</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditLog}>
          <Icon name="create-outline" size={20} color={colors.white} />
          <Text style={styles.editButtonText}>Edit Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteLog}
          disabled={deleting}
        >
          <Icon name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>
            {deleting ? 'Deleting…' : 'Delete Log'}
          </Text>
        </TouchableOpacity>
      </View>
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
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  itemsContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
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
    marginTop: 2,
  },
  itemWorn: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  editButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  deleteButtonText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  headerRightSpacer: {
    width: 40,
  },
});
