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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDatePicker from '../components/CustomDatePicker';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getClothing, createWearLog, Clothing } from '../services/api';
import { localDateString } from '../utils/date';

// Parse a 'YYYY-MM-DD' string into a LOCAL Date (new Date('YYYY-MM-DD') parses as
// UTC midnight, which the picker would render as the previous day for users
// behind UTC — the same shift localDateString() guards against on the way out).
const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

type Props = {
  navigation: any;
};

export default function LogOutfitScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logDate, setLogDate] = useState(localDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');
  const [wardrobe, setWardrobe] = useState<Clothing[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const items = await getClothing(token);
        if (!active) return;
        // Only Available items can be logged into a new outfit.
        setWardrobe(items.filter(i => i.status === 'Available'));
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to load wardrobe');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

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
    // The regex only checks shape — V8 rejects impossible ISO dates like
    // 2026-02-30, so catch them here instead of as a server cast error.
    if (Number.isNaN(new Date(logDate.trim()).getTime())) {
      Alert.alert('Invalid date', 'That date does not exist.');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('No items', 'Select at least one item worn.');
      return;
    }
    setSaving(true);
    try {
      await createWearLog(token, {
        logDate: logDate.trim(),
        clothingWorn: selectedIds.map(id => ({ itemId: id })),
        outfitName: outfitName.trim() || undefined,
        occasion: occasion.trim(),
        notes: notes.trim(),
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to log outfit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Outfit</Text>
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
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Icon name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.dateText}>{logDate}</Text>
          </TouchableOpacity>
          <CustomDatePicker
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onConfirm={date => {
              setLogDate(localDateString(date));
              setShowDatePicker(false);
            }}
            initialDate={parseLocalDate(logDate)}
            title="Select Date"
            allowPastDates
            maxDate={new Date()}
          />

          <Text style={styles.label}>Outfit Name</Text>
          <TextInput
            style={styles.input}
            value={outfitName}
            onChangeText={setOutfitName}
            placeholder="e.g. Work fit, Date night"
            placeholderTextColor={colors.textSecondary}
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
              {saving ? 'Saving…' : 'Log Outfit'}
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
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
  },
  dateText: {
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
