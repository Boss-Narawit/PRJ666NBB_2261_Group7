import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/TabNavigator';
import { colors } from '../theme';
import { getStoredUser } from '../services/session';
import { deleteAccount } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileScreen'>;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type RowProps = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuRow({ icon, label, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Icon
        name={icon}
        size={22}
        color={danger ? colors.error : colors.textPrimary}
        style={styles.rowIcon}
      />
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
        {label}
      </Text>
      <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { token, signOut } = useAuth();
  const [user, setUser] = useState({ name: '', email: '' });
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      getStoredUser()
        .then(setUser)
        .catch(() => setUser({ name: '', email: '' }));
    }
  }, [isFocused]);

  const comingSoon = () =>
    Alert.alert('Coming soon', 'This feature is not available yet.');

  const openSettings = () =>
    navigation.getParent()?.navigate('Settings' as never);

  const handleDeleteAccount = () =>
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (token) await deleteAccount(token);
              await signOut();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
    );

  const handleLogout = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <Text testID="profile-name" style={styles.name}>
          {user.name || 'Your Name'}
        </Text>
        <Text style={styles.email}>{user.email || 'your@email.com'}</Text>
      </View>

      {/* Account */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <MenuRow
          icon="person-outline"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />

        <View style={styles.separator} />
        <MenuRow
          icon="notifications-outline"
          label="Notification Settings"
          onPress={comingSoon}
        />
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <MenuRow
          icon="settings-outline"
          label="Settings"
          onPress={openSettings}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="lock-closed-outline"
          label="Privacy Policy"
          onPress={comingSoon}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="help-circle-outline"
          label="Help & Support"
          onPress={comingSoon}
        />
      </View>

      {/* Danger zone */}
      <Text style={styles.sectionTitle}>Account Management</Text>
      <View style={styles.card}>
        <MenuRow
          icon="trash-outline"
          label="Delete Account"
          onPress={handleDeleteAccount}
          danger
        />
      </View>

      {/* Log out */}
      <TouchableOpacity
        testID="profile-logout"
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Log Out</Text>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowLabelDanger: {
    color: colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginLeft: 52,
  },
  logoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
