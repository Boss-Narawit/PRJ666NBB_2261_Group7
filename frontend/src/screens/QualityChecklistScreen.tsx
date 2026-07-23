import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { exportResale, exportDonation, ExportPayload } from '../services/api';

type Props = {
  navigation: any;
  route: {
    params: {
      items: string[];
      type: 'resale' | 'donation';
      destination: string;
    };
  };
};

// Fields shared with the partner (BR22). The list is fixed, but it is shown to
// the user and consent must be explicitly given — never fabricated by the UI.
const SHARED_FIELDS = ['name', 'brand', 'category', 'condition', 'imageUrl'];
const SHARED_FIELDS_LABEL = 'name, brand, category, condition, photo';

export default function QualityChecklistScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { items, type, destination } = route.params;
  const { token } = useAuth();

  const [checklist, setChecklist] = useState({
    tears: false,
    stains: false,
    buttonsZippers: false,
    photos: false,
    description: false,
  });
  const [submitting, setSubmitting] = useState(false);
  // BR17: consent is the user's own action, separate from the quality checks.
  const [consent, setConsent] = useState(false);

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(v => v === true);

  const handleConfirmExport = async () => {
    if (!allChecked) {
      Alert.alert('Error', 'Please complete all checklist items');
      return;
    }
    if (!consent) {
      Alert.alert('Error', 'Please consent to sharing your item data');
      return;
    }
    if (!token) return;
    setSubmitting(true);

    // Backend exports one item at a time (each archives transactionally),
    // so loop the selection and report any per-item failures (e.g. BR21).
    const exportOne = type === 'resale' ? exportResale : exportDonation;
    let succeeded = 0;
    const failures: string[] = [];

    for (const clothingId of items) {
      const payload: ExportPayload = {
        clothingId,
        partnerId: destination,
        checklistCompleted: allChecked,
        consent,
        selectedFields: SHARED_FIELDS,
      };
      try {
        await exportOne(token, payload);
        succeeded += 1;
      } catch (err: any) {
        failures.push(err.message || 'Unknown error');
      }
    }

    setSubmitting(false);

    const summary =
      failures.length === 0
        ? `Your ${succeeded} item(s) have been exported for ${type}!`
        : `${succeeded} exported, ${failures.length} failed:\n${failures.join(
            '\n',
          )}`;
    Alert.alert('Export Result', summary, [
      // QualityChecklist is deep in the Home stack; pop back to the Dashboard
      // root (same landing as before, now without leaving the Home tab).
      { text: 'OK', onPress: () => navigation.popToTop() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quality Checklist</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Please confirm the following before exporting {items.length} item(s)
            for {type}
          </Text>
        </View>

        {/* Checklist Items */}
        <View style={styles.checklistContainer}>
          <TouchableOpacity
            style={styles.checklistItem}
            onPress={() => toggleChecklist('tears')}
          >
            <View
              style={[
                styles.checkbox,
                checklist.tears && styles.checkboxChecked,
              ]}
            >
              {checklist.tears && (
                <Icon name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={styles.checklistText}>No major tears</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checklistItem}
            onPress={() => toggleChecklist('stains')}
          >
            <View
              style={[
                styles.checkbox,
                checklist.stains && styles.checkboxChecked,
              ]}
            >
              {checklist.stains && (
                <Icon name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={styles.checklistText}>No heavy stains</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checklistItem}
            onPress={() => toggleChecklist('buttonsZippers')}
          >
            <View
              style={[
                styles.checkbox,
                checklist.buttonsZippers && styles.checkboxChecked,
              ]}
            >
              {checklist.buttonsZippers && (
                <Icon name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={styles.checklistText}>Buttons & zippers work</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checklistItem}
            onPress={() => toggleChecklist('photos')}
          >
            <View
              style={[
                styles.checkbox,
                checklist.photos && styles.checkboxChecked,
              ]}
            >
              {checklist.photos && (
                <Icon name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={styles.checklistText}>Accurate photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checklistItem}
            onPress={() => toggleChecklist('description')}
          >
            <View
              style={[
                styles.checkbox,
                checklist.description && styles.checkboxChecked,
              ]}
            >
              {checklist.description && (
                <Icon name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={styles.checklistText}>Matches description</Text>
          </TouchableOpacity>
        </View>

        {/* Data-sharing consent (BR17/BR22) */}
        <View style={styles.consentContainer}>
          <TouchableOpacity
            style={styles.checklistItem}
            onPress={() => setConsent(prev => !prev)}
          >
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
              {consent && (
                <Icon name="checkmark" size={18} color={colors.white} />
              )}
            </View>
            <Text style={styles.checklistText}>
              I consent to sharing this item's details with the partner
            </Text>
          </TouchableOpacity>
          <Text style={styles.sharedFieldsText}>
            Shared with the partner: {SHARED_FIELDS_LABEL}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!allChecked || !consent || submitting) &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmExport}
            disabled={!allChecked || !consent || submitting}
          >
            <Text style={styles.confirmButtonText}>
              {submitting ? 'Exporting…' : 'Confirm & Export'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

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
  infoContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checklistContainer: {
    marginHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checklistText: {
    fontSize: 16,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  consentContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  sharedFieldsText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },
  actionContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});
