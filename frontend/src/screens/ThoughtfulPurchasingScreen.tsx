import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomDatePicker from '../components/CustomDatePicker';
import { useAuth } from '../context/AuthContext';
import { createPurchase, uploadClothingImage } from '../services/api';

// BR14: the cooling-off period must be at least 24h (1440 min).
const COOLDOWN_MIN_MINUTES = 1440;

type Props = {
  navigation: any;
};

export default function ThoughtfulPurchasingScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');

  // Set start date to today, end date to tomorrow
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [startDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(tomorrow);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSimilarityResult, setShowSimilarityResult] = useState(false);
  const [similarityScore] = useState<number>(75);
  const [submitting, setSubmitting] = useState(false);

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const selectPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      response => {
        if (response.assets && response.assets[0]?.uri) {
          setPhoto(response.assets[0].uri);
        } else if (response.didCancel) {
          // user cancelled the picker — no action needed
        } else {
          Alert.alert('Error', 'Failed to select photo');
        }
      },
    );
  };

  const handleSimilarityCheck = () => {
    if (!photo) {
      Alert.alert('Error', 'Please upload an image first');
      return;
    }
    setShowSimilarityResult(true);
  };

  const handleStartTimer = async () => {
    if (!token) return;
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter what you are considering buying');
      return;
    }
    // Require a photo so it flows through to the cart and into the wardrobe on
    // "Buy it" (BR4 needs an image for any wardrobe item).
    if (!photo) {
      Alert.alert('Error', 'Please upload an image first');
      return;
    }
    // The picker has day granularity (returns local midnight), so measure in whole
    // calendar days from start → end. This is independent of tap time, so the
    // default (tomorrow) is always exactly 1440 min and never trips BR14 by lingering.
    const dayStart = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const days = Math.round(
      (dayStart(endDate).getTime() - dayStart(startDate).getTime()) / 86400000,
    );
    const cooldownMinutes = days * 24 * 60;
    if (cooldownMinutes < COOLDOWN_MIN_MINUTES) {
      Alert.alert('Error', 'The cooling-off period must be at least 24 hours.');
      return;
    }

    setSubmitting(true);
    try {
      // Upload the picked photo to Cloudinary first; persist the hosted URL on the
      // purchase so the cart and the wardrobe Add form can reuse it.
      const imageUrl = await uploadClothingImage(token, { uri: photo });
      await createPurchase(token, {
        itemName: itemName.trim(),
        cooldownMinutes,
        imageUrl,
      });
      setShowSimilarityResult(false);
      Alert.alert(
        'Cooling-off Timer Started',
        `Your cooling-off period runs until ${formatDate(endDate)}. You'll be able to confirm the purchase in your cart once it ends.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not start the timer.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSimilarityResult = () => {
    const isSimilar = similarityScore >= 70;
    const iconName = isSimilar ? 'warning-outline' : 'checkmark-circle-outline';
    const iconColor = isSimilar ? '#e53e3e' : '#38A169';
    const resultText = isSimilar
      ? `This item is ${similarityScore}% similar to items in your wardrobe. Do you really need it?`
      : `Great news! This item is only ${similarityScore}% similar to items in your wardrobe.`;

    return (
      <Modal
        visible={showSimilarityResult}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Similarity Check</Text>
              <TouchableOpacity onPress={() => setShowSimilarityResult(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.resultContainer}>
              <Icon name={iconName} size={80} color={iconColor} />
              <Text style={[styles.resultScore, { color: iconColor }]}>
                {similarityScore}%
              </Text>
              <Text style={styles.resultText}>{resultText}</Text>
            </View>

            {isSimilar && (
              <View style={styles.warningContainer}>
                <Icon name="bulb-outline" size={20} color="#D69E2E" />
                <Text style={styles.warningText}>
                  You might already own something similar. Consider waiting 24
                  hours before purchasing.
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowSimilarityResult(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.startTimerModalButton]}
                onPress={handleStartTimer}
                disabled={submitting}
              >
                <Text style={styles.startTimerText}>
                  {submitting ? 'Starting…' : 'Start Timer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Upload Image */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Image</Text>
        <TouchableOpacity style={styles.uploadContainer} onPress={selectPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Icon
                name="cloud-upload-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.uploadText}>Tap to upload image</Text>
              <Text style={styles.uploadSubtext}>JPG, PNG, WEBP supported</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Item Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Item Name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="What are you considering buying?"
          placeholderTextColor={colors.textSecondary}
          value={itemName}
          onChangeText={setItemName}
        />
      </View>

      {/* Date Section */}
      <View style={styles.section}>
        <View style={styles.dateContainer}>
          {/* Start Date - Disabled */}
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <View style={[styles.dateInput, styles.dateInputDisabled]}>
              <Icon
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.dateText, styles.dateTextDisabled]}>
                {formatDate(startDate)}
              </Text>
            </View>
          </View>

          {/* End Date - Editable with Custom Picker */}
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEndPicker(true)}
            >
              <Icon name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Custom Date Picker Modal */}
      <CustomDatePicker
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onConfirm={date => {
          setEndDate(date);
          setShowEndPicker(false);
        }}
        initialDate={endDate}
        startDate={startDate} // ← Pass the start date to prevent selecting dates before it
        mode="end"
      />

      {/* AI Similarity Check Button */}
      <TouchableOpacity
        style={styles.similarityButton}
        onPress={handleSimilarityCheck}
      >
        <Icon name="scan-outline" size={24} color={colors.white} />
        <Text style={styles.similarityButtonText}>AI Similarity Check</Text>
      </TouchableOpacity>

      {/* Start Timer Button */}
      <TouchableOpacity
        style={styles.startTimerButton}
        onPress={handleStartTimer}
        disabled={submitting}
      >
        <Icon name="hourglass-outline" size={24} color={colors.white} />
        <Text style={styles.startTimerButtonText}>
          {submitting ? 'Starting…' : 'Start Timer'}
        </Text>
      </TouchableOpacity>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Icon
          name="information-circle-outline"
          size={20}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          Upload an image of an item you're considering purchasing. The AI will
          compare it with your existing wardrobe and alert you if you already
          own something similar.
        </Text>
      </View>

      {/* Similarity Result Modal */}
      {renderSimilarityResult()}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  dateInputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E6E6E6',
  },
  dateText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  dateTextDisabled: {
    color: colors.textSecondary,
  },
  similarityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  similarityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  startTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  startTimerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 12,
  },
  resultText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#D69E2E15',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D69E2E30',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButton: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  cancelModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  startTimerModalButton: {
    backgroundColor: colors.primary,
  },
  startTimerText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
