import React, { useState } from 'react';
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

export default function QualityChecklistScreen({ navigation, route }: Props) {
  const { items, type, destination } = route.params;
  
  const [checklist, setChecklist] = useState({
    tears: false,
    stains: false,
    buttonsZippers: false,
    photos: false,
    description: false,
  });

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(v => v === true);

  const handleConfirmExport = () => {
    if (!allChecked) {
      Alert.alert('Error', 'Please complete all checklist items');
      return;
    }

    Alert.alert(
      'Export Confirmed',
      `Your ${items.length} item(s) have been exported for ${type}!`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quality Checklist</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Please confirm the following before exporting {items.length} item(s) for {type}
        </Text>
      </View>

      {/* Checklist Items */}
      <View style={styles.checklistContainer}>
        <TouchableOpacity
          style={styles.checklistItem}
          onPress={() => toggleChecklist('tears')}
        >
          <View style={[styles.checkbox, checklist.tears && styles.checkboxChecked]}>
            {checklist.tears && <Icon name="checkmark" size={18} color={colors.white} />}
          </View>
          <Text style={styles.checklistText}>No major tears</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checklistItem}
          onPress={() => toggleChecklist('stains')}
        >
          <View style={[styles.checkbox, checklist.stains && styles.checkboxChecked]}>
            {checklist.stains && <Icon name="checkmark" size={18} color={colors.white} />}
          </View>
          <Text style={styles.checklistText}>No heavy stains</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checklistItem}
          onPress={() => toggleChecklist('buttonsZippers')}
        >
          <View style={[styles.checkbox, checklist.buttonsZippers && styles.checkboxChecked]}>
            {checklist.buttonsZippers && <Icon name="checkmark" size={18} color={colors.white} />}
          </View>
          <Text style={styles.checklistText}>Buttons & zippers work</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checklistItem}
          onPress={() => toggleChecklist('photos')}
        >
          <View style={[styles.checkbox, checklist.photos && styles.checkboxChecked]}>
            {checklist.photos && <Icon name="checkmark" size={18} color={colors.white} />}
          </View>
          <Text style={styles.checklistText}>Accurate photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checklistItem}
          onPress={() => toggleChecklist('description')}
        >
          <View style={[styles.checkbox, checklist.description && styles.checkboxChecked]}>
            {checklist.description && <Icon name="checkmark" size={18} color={colors.white} />}
          </View>
          <Text style={styles.checklistText}>Matches description</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, !allChecked && styles.confirmButtonDisabled]}
          onPress={handleConfirmExport}
          disabled={!allChecked}
        >
          <Text style={styles.confirmButtonText}>Confirm & Export</Text>
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