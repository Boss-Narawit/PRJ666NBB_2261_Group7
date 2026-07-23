import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

import HomeStackNavigator from './HomeStackNavigator';
import ThoughtfulPurchasing from '../screens/ThoughtfulPurchasingScreen';
import CartScreen from '../screens/CartScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
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
        // Per-screen headerTitle below — no global title, so tabs that show a
        // header label it themselves and screens with their own in-page title
        // hide the header entirely instead of all reading "ReDrobe".
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
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        // Show the tab-level "ReDrobe" header only while the Home stack is on
        // its Dashboard root — pushed screens render their own headers, so a
        // deeper route would otherwise stack two headers.
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'Dashboard';
          // "ReDrobe" branding only on the Dashboard root; pushed screens hide
          // this header and render their own.
          return {
            headerShown: routeName === 'Dashboard',
            headerTitle: 'ReDrobe',
          };
        }}
        // Re-pressing the already-focused Home tab pops its nested stack back
        // to the Dashboard (bottom-tabs does not do this by default).
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (navigation.isFocused()) {
              e.preventDefault();
              navigation.navigate('Home', { screen: 'Dashboard' });
            }
          },
        })}
      />
      <Tab.Screen
        name="ThoughtfulPurchasing"
        component={ThoughtfulPurchasing}
        options={{
          tabBarLabel: 'Thoughtful Purchase',
          headerShown: false, // screen renders its own in-page title
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'compass' : 'compass-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarButtonTestID: 'tab-profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
