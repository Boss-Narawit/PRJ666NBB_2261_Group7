import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const handleNavigateToEditProfile = () => {
    navigation.navigate('EditProfile' as any);
  };

  const handleNavigateToNotifications = () => {
    navigation.navigate('NotificationSettings' as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Personal info Section */}
      <Text style={styles.sectionTitle}>Personal info</Text>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={handleNavigateToEditProfile}
        activeOpacity={0.8}
      >
        <Icon
          name="person-outline"
          size={24}
          color="#000000"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => navigation.navigate('Privacy')}
        activeOpacity={0.8}
      >
        <Icon
          name="lock-closed-outline"
          size={24}
          color="#000000"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Privacy</Text>
      </TouchableOpacity>

      {/* General Section */}
      <Text style={styles.sectionTitle}>General</Text>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={handleNavigateToNotifications}
        activeOpacity={0.8}
      >
        <Icon
          name="notifications-outline"
          size={24}
          color="#000000"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Notification</Text>
      </TouchableOpacity>

      {/* App info Section */}
      <Text style={styles.sectionTitle}>App info</Text>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => navigation.navigate('FAQ')}
        activeOpacity={0.8}
      >
        <Icon
          name="chatbubble-ellipses-outline"
          size={24}
          color="#000000"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>FAQ</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => navigation.navigate('Announcements')}
        activeOpacity={0.8}
      >
        <Icon
          name="megaphone-outline"
          size={24}
          color="#000000"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Announcement</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => navigation.navigate('About')}
        activeOpacity={0.8}
      >
        <Icon
          name="information-circle-outline"
          size={24}
          color="#000000"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>About ReDrobe</Text>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 8,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  buttonIcon: {
    position: 'absolute',
    left: 16,
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
