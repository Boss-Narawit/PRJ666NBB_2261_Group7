import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

type Props = {
  navigation: any;
};

interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  type: 'feature' | 'update' | 'event';
}

const announcements: Announcement[] = [
  {
    id: '1',
    title: '🎉 2025 Style Recap is Here!',
    date: 'December 20, 2025',
    content: 'Your 2025 Style Recap is now available! Discover your most worn items, sustainability stats, and more. Check it out from your dashboard!',
    type: 'feature',
  },
  {
    id: '2',
    title: 'New Export Partners Added',
    date: 'November 15, 2025',
    content: 'We\'ve added 3 new resale partners and 2 donation centers to our export network. You can now reach even more platforms directly from ReDrobe.',
    type: 'update',
  },
  {
    id: '3',
    title: 'Thoughtful Purchasing Beta',
    date: 'October 1, 2025',
    content: 'The Thoughtful Purchasing feature is now in beta! Upload images of items you\'re considering and get AI-powered similarity checks to help you make conscious fashion choices.',
    type: 'feature',
  },
  {
    id: '4',
    title: 'Forgotten Items Custom Threshold',
    date: 'September 10, 2025',
    content: 'You can now customize the forgotten items threshold! Set your preferred days (minimum 7 days) to control when items appear in your forgotten items list.',
    type: 'update',
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'feature': return colors.primary;
    case 'update': return '#D69E2E';
    case 'event': return '#38A169';
    default: return colors.textSecondary;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'feature': return 'New Feature';
    case 'update': return 'Update';
    case 'event': return 'Event';
    default: return type;
  }
};

export default function AnnouncementScreen({ navigation }: Props) {
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
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {announcements.map((item) => (
          <View key={item.id} style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementType}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(item.type) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: getTypeColor(item.type) },
                    ]}
                  >
                    {getTypeLabel(item.type)}
                  </Text>
                </View>
                <Text style={styles.announcementDate}>{item.date}</Text>
              </View>
              <Text style={styles.announcementTitle}>{item.title}</Text>
            </View>
            <Text style={styles.announcementContent}>{item.content}</Text>
          </View>
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  announcementCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  announcementHeader: {
    marginBottom: 12,
  },
  announcementType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  announcementDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  announcementContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});