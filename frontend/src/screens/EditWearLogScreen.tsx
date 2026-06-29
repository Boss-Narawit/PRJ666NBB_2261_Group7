import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  getWearLogById,
  getClothing,
  updateWearLog,
  Clothing,
} from '../services/api';

type Props = {
  navigation: any;
  route: { params: { logId: string } };
};

export default function EditWearLogScreen({ navigation, route }: Props) {
  const { logId } = route.params;
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logDate, setLogDate] = useState('');
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');
  const [wardrobe, setWardrobe] = useState<Clothing[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const [log, items] = await Promise.all([
          getWearLogById(token, logId),
          getClothing(token),
        ]);
        if (!active) return;
        setLogDate(log.logDate.slice(0, 10));
        setOccasion(log.occasion ?? '');
        setNotes(log.notes ?? '');
        setSelectedIds(
          log.clothingWorn.filter(c => c.itemId).map(c => c.itemId!._id),
        );
        setWardrobe(items);
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to load wear log');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token, logId]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!token) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate.trim())) {
      Alert.alert('Invalid date', 'Use the format YYYY-MM-DD.');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('No items', 'Select at least one item worn.');
      return;
    }
    setSaving(true);
    try {
      await updateWearLog(token, logId, {
        logDate: logDate.trim(),
        clothingWorn: selectedIds.map(id => ({ itemId: id })),
        occasion: occasion.trim(),
        notes: notes.trim(),
      });
      navigation.navigate('WearLog');
    } catch (err: any) {
      const msg =
        err.status === 409
          ? 'You already have a wear log for that day.'
          : err.message || 'Failed to update wear log';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Wear Log</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
        >
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={logDate}
            onChangeText={setLogDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Occasion</Text>
          <TextInput
            style={styles.input}
            value={occasion}
            onChangeText={setOccasion}
            placeholder="e.g. Work, Casual"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <Text style={styles.label}>Items Worn</Text>
          {wardrobe.length === 0 ? (
            <Text style={styles.emptyText}>No items in your wardrobe.</Text>
          ) : (
            wardrobe.map(item => {
              const selected = selectedIds.includes(item._id);
              return (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.itemRow, selected && styles.itemRowSelected]}
                  onPress={() => toggleItem(item._id)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemBrand}>Brand: {item.brand}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 48,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  itemRowSelected: {
    borderColor: colors.primary,
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
  saveButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
