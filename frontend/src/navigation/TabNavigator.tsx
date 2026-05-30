import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { getToken } from '../services/session';

import MainScreen from '../screens/MainScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CartScreen from '../screens/CartScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

export type ProfileStackParamList = {
  Login: undefined;
  Register: undefined;
  ProfileScreen: undefined;
};

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  // Route based on auth state: show ProfileScreen if a token is stored, else Login.
  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getToken()
      .then(token => setHasToken(!!token))
      .catch(() => setHasToken(false))
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ProfileStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasToken ? 'ProfileScreen' : 'Login'}
    >
      <ProfileStack.Screen name="Login" component={LoginScreen} />
      <ProfileStack.Screen name="Register" component={SignUpScreen} />
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFE9FB',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          elevation: 0, // Remove Android shadow
          shadowOpacity: 0, // Remove iOS shadow
        },
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#FFE9FB',
          borderBottomWidth: 0.5,
          borderBottomColor: '#E6E6E6',
          elevation: 0, // remove Android shadow
          shadowOpacity: 0, // remove iOS shadow
        },
        headerTitleStyle: {
          // fontFamily: 'Inter', // Uncomment if the Inter font is installed
          fontWeight: '600',
          fontSize: 24,
          color: '#000000',
        },
        headerTitle: 'ReDrobe',
        headerLeft: () =>
          navigation.canGoBack() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 16 }}
            >
              <Icon name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
          ) : null,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings' as any)}
            style={{ paddingRight: 16 }}
          >
            <Icon name="settings-outline" size={24} color="#000000" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Home" component={MainScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarButtonTestID: 'tab-profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
