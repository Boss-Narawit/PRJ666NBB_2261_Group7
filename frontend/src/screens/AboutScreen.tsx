import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

type Props = {
  navigation: any;
};

export default function AboutScreen({ navigation }: Props) {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // Handle error
    });
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
        <Text style={styles.headerTitle}>About ReDrobe</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>ReDrobe</Text>
          </View>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Reduce, Reuse, ReDrobe</Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is ReDrobe?</Text>
          <Text style={styles.sectionDescription}>
            ReDrobe is a digital wardrobe platform that helps you manage your
            clothing sustainably. We integrate wardrobe inventory, wear
            tracking, analytics, and intelligent reminders to help you make the
            most of your existing garments.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionDescription}>
            To minimize fashion waste and impulsive spending by empowering users
            to develop and maintain an organized wardrobe while making better
            use of their clothes.
          </Text>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Team</Text>
          <Text style={styles.sectionDescription}>
            ReDrobe was built by a passionate team of 5 developers as part of
            the PRJ666 course project, combining expertise in mobile
            development, backend engineering, AI, and UX design.
          </Text>
          <View style={styles.teamList}>
            <Text style={styles.teamMember}>
              • Nada Khan — Lead UI/UX Designer & Frontend Developer
            </Text>
            <Text style={styles.teamMember}>
              • Narawit Sawatdecha — Project Manager & Backend Developer
            </Text>
            <Text style={styles.teamMember}>
              • Trinity Ma — QA & Analytics Developer
            </Text>
            <Text style={styles.teamMember}>
              • Beomgu Jeon — Technical Lead & System Architect
            </Text>
            <Text style={styles.teamMember}>
              • Seulgi Lee — Data & AI / Algorithm Developer
            </Text>
          </View>
        </View>

        {/* Tech Stack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technology Stack</Text>
          <View style={styles.techStack}>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Frontend</Text>
              <Text style={styles.techValue}>React Native</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Backend</Text>
              <Text style={styles.techValue}>Node.js, Express</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Database</Text>
              <Text style={styles.techValue}>MongoDB</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>State Management</Text>
              <Text style={styles.techValue}>Zustand</Text>
            </View>
          </View>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={() => openLink('https://github.com/your-repo')}
          >
            <Text style={styles.footerLink}>GitHub</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity
            onPress={() => openLink('mailto:privacy@redrobe.com')}
          >
            <Text style={styles.footerLink}>Contact</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  teamList: {
    marginTop: 12,
    gap: 4,
  },
  teamMember: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  techStack: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginTop: 8,
  },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  techLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  techValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  footerDivider: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
