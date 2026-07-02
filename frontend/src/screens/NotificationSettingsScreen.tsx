import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { getToken } from '../services/session';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

type FrequencyOption = 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';

export default function NotificationSettingsScreen({ navigation }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // States for preferences
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [frequency, setFrequency] = useState<FrequencyOption>('Daily');
  const [itemStatusChange, setItemStatusChange] = useState(true);
  const [forgottenItemAlert, setForgottenItemAlert] = useState(true);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const userToken = await getToken();
      if (userToken) {
        setToken(userToken);
        const prefs = await getNotificationPreferences(userToken);
        setAllowNotifications(prefs.notificationEnabled);
        setFrequency(prefs.notificationFrequency);
        setItemStatusChange(prefs.itemStatusChangeEnabled);
        setForgottenItemAlert(prefs.forgottenItemAlertEnabled);
      }
    } catch (err: any) {
      // Block the form instead of alerting over it — otherwise the hardcoded
      // defaults render live and a Save would overwrite the real server prefs.
      setLoadError(err.message || 'Failed to load notification preferences.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = async () => {
    if (!token) {
      Alert.alert(
        'Authentication Error',
        'Session expired. Please log in again.',
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateNotificationPreferences(token, {
        notificationEnabled: allowNotifications,
        notificationFrequency: frequency,
        itemStatusChangeEnabled: itemStatusChange,
        forgottenItemAlertEnabled: forgottenItemAlert,
      });

      Alert.alert('Success', 'Preferences saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadErrorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const frequencies: FrequencyOption[] = [
    'Daily',
    'Weekly',
    'Bi-Weekly',
    'Monthly',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Allow Notifications Switch Row */}
      <View style={styles.switchRow}>
        <Text style={styles.rowLabel}>Allow Notifications</Text>
        <Switch
          value={allowNotifications}
          onValueChange={setAllowNotifications}
          trackColor={{ false: '#D1D1D6', true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
        />
      </View>

      {/* Notification Frequency Section */}
      <Text style={styles.sectionTitle}>Notification Frequency</Text>
      <View style={styles.card}>
        {frequencies.map((option, index) => {
          const isSelected = frequency === option;
          return (
            <React.Fragment key={option}>
              {index > 0 && <View style={styles.separator} />}
              <TouchableOpacity
                style={styles.frequencyRow}
                onPress={() => allowNotifications && setFrequency(option)}
                disabled={!allowNotifications}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.frequencyLabel,
                    !allowNotifications && styles.disabledText,
                  ]}
                >
                  {option}
                </Text>
                {isSelected && (
                  <Icon
                    name="checkmark-circle"
                    size={24}
                    color={allowNotifications ? '#4CD964' : '#C7C7CC'}
                  />
                )}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* Other switches */}
      <View style={[styles.switchRow, styles.marginTop]}>
        <Text
          style={[styles.rowLabel, !allowNotifications && styles.disabledText]}
        >
          Item Status Change
        </Text>
        <Switch
          value={itemStatusChange && allowNotifications}
          onValueChange={setItemStatusChange}
          disabled={!allowNotifications}
          trackColor={{ false: '#D1D1D6', true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
        />
      </View>

      <View style={styles.switchRow}>
        <Text
          style={[styles.rowLabel, !allowNotifications && styles.disabledText]}
        >
          Forgotten item Alert
        </Text>
        <Switch
          value={forgottenItemAlert && allowNotifications}
          onValueChange={setForgottenItemAlert}
          disabled={!allowNotifications}
          trackColor={{ false: '#D1D1D6', true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
        />
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.disabledButton]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.8}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Preference</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadErrorText: {
    fontSize: 14,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  frequencyLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  disabledText: {
    color: '#999',
  },
  marginTop: {
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
