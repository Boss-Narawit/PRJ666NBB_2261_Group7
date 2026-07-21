import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

type Props = {
  navigation: any;
};

export default function HelpScreen({ navigation }: Props) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message fields.');
      return;
    }
    Alert.alert(
      'Message Sent!',
      'Our support team will get back to you within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setSubject('');
            setMessage('');
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Contact Info Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Icon name="mail-outline" size={22} color={colors.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Us</Text>
              <Text style={styles.contactValue}>support@redrobe.com</Text>
            </View>
          </View>
          <View style={styles.contactDivider} />
          <View style={styles.contactRow}>
            <View
              style={[styles.contactIcon, { backgroundColor: colors.warning }]}
            >
              <Icon name="time-outline" size={22} color={colors.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Response Time</Text>
              <Text style={styles.contactValue}>Within 24 hours</Text>
            </View>
          </View>
        </View>

        {/* FAQ Quick Link */}
        <TouchableOpacity
          style={styles.faqLink}
          onPress={() => navigation.navigate('FAQ')}
        >
          <View style={styles.faqLinkContent}>
            <Icon name="book-outline" size={24} color={colors.primary} />
            <View style={styles.faqLinkText}>
              <Text style={styles.faqLinkTitle}>Browse FAQ</Text>
              <Text style={styles.faqLinkSubtitle}>
                Find answers to common questions
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Contact Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Report a Problem</Text>
          <Text style={styles.formSubtitle}>
            Describe your issue and we'll get back to you as soon as possible.
          </Text>

          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="What is the issue about?"
            placeholderTextColor={colors.textSecondary}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.inputLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your issue in detail..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  contactCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  contactDivider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginVertical: 12,
  },
  faqLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: 20,
  },
  faqLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqLinkText: {
    marginLeft: 12,
    flex: 1,
  },
  faqLinkTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  faqLinkSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
