import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AddClothScreen from '../screens/AddClothScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import WearHistoryScreen from '../screens/WearHistoryScreen';
import WearLogDetailScreen from '../screens/WearLogDetailScreen';
import ExportScreen from '../screens/ExportScreen';
import QualityChecklistScreen from '../screens/QualityChecklistScreen';
import ForgottenItemsScreen from '../screens/ForgottenItemsScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Settings: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  Wardrobe: undefined;
  AddCloth: undefined;
  WearLog: undefined;
  WearLogDetail: {
    logId: string;
    date: string;
    items: {
      name: string;
      brand?: string;
      wearCount: number;
      image?: string;
    }[];
  };
  Export: undefined;
  QualityChecklist: {
    items: string[];
    type: 'resale' | 'donation';
    destination: string;
  };
  ForgottenItems: undefined;
  ItemDetail: {
    itemId?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStacks() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={({ navigation }: any) => ({
                headerShown: true,
                headerTitle: 'Setting',
                headerStyle: {
                  backgroundColor: '#FFE9FB',
                },
                headerShadowVisible: false,
                headerTitleStyle: {
                  fontWeight: '600',
                  fontSize: 24,
                  color: '#000000',
                },
                headerTitleAlign: 'center',
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ paddingLeft: 16 }}
                  >
                    <Icon name="chevron-back" size={24} color="#000000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={({ navigation }: any) => ({
                headerShown: true,
                headerTitle: 'Edit Profile',
                headerStyle: {
                  backgroundColor: '#FFE9FB',
                },
                headerShadowVisible: false,
                headerTitleStyle: {
                  fontWeight: '600',
                  fontSize: 24,
                  color: '#000000',
                },
                headerTitleAlign: 'center',
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ paddingLeft: 16 }}
                  >
                    <Icon name="chevron-back" size={24} color="#000000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={({ navigation }: any) => ({
                headerShown: true,
                headerTitle: 'Notifications',
                headerStyle: {
                  backgroundColor: '#FFE9FB',
                },
                headerShadowVisible: false,
                headerTitleStyle: {
                  fontWeight: '600',
                  fontSize: 24,
                  color: '#000000',
                },
                headerTitleAlign: 'center',
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ paddingLeft: 16 }}
                  >
                    <Icon name="chevron-back" size={24} color="#000000" />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="Wardrobe"
              component={WardrobeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddCloth"
              component={AddClothScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WearLog"
              component={WearHistoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WearLogDetail"
              component={WearLogDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Export" 
              component={ExportScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="QualityChecklist" 
              component={QualityChecklistScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ForgottenItems"
              component={ForgottenItemsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ItemDetail" 
              component={ItemDetailScreen} 
              options={{ headerShown: false }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <RootStacks />
    </AuthProvider>
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
