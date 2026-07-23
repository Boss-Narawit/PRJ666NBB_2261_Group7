import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

type Props = {
  navigation: any;
};

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I add clothes to my wardrobe?',
    answer:
      'Tap the "+" button on the Wardrobe screen or the "Add New Cloth" button. You can upload photos, add brand, category, color, size, and other details about your clothing item.',
  },
  {
    id: '2',
    question: 'What is the "Thoughtful Purchasing" feature?',
    answer:
      "This feature helps you avoid impulse buying. Upload an image of an item you're considering purchasing, and our AI will check if you already own something similar. You can also set a cooling-off period (minimum 24-hours) before making a purchase.",
  },
  {
    id: '3',
    question: 'How does the "Forgotten Items" feature work?',
    answer:
      "ReDrobe tracks when you last wore each item. If an item hasn't been worn for 21+ days (you can customize this threshold), it appears in your Forgotten Items list, helping you rediscover clothes you might have forgotten about.",
  },
  {
    id: '4',
    question: 'Can I export my clothes for resale or donation?',
    answer:
      'Yes! Select items from your wardrobe, choose a resale platform or donation center, complete the quality checklist, and export. Your item details will be shared with your chosen partner.',
  },
  {
    id: '5',
    question: 'How is my data protected?',
    answer:
      'We take your privacy seriously. Your data is encrypted and never sold to third parties. You control what information is shared when exporting items. You can also delete your account at any time.',
  },
  {
    id: '6',
    question: 'What happens when I delete my account?',
    answer:
      'Your account will be scheduled for deletion. All your data will be permanently removed after 30 days. You can reactivate your account within that period.',
  },
];

export default function FAQScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {faqData.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.faqItem}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Icon
                name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </View>
            {expandedId === item.id && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  faqItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
});
