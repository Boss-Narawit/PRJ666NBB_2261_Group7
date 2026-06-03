import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStacks() {
  const { token, isLoading } = useAuth();

  // Wait for the stored token check before deciding which stack to show,
  // so we never flash Login for an already-logged-in user.
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
              options={{
                headerShown: true,
                headerTitle: 'Settings',
                headerStyle: {
                  backgroundColor: '#FFE9FB',
                },
                headerShadowVisible: true,
                headerTitleStyle: {
                  fontWeight: '600',
                  fontSize: 24,
                  color: '#000000',
                },
                headerTitleAlign: 'center',
              }}
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
