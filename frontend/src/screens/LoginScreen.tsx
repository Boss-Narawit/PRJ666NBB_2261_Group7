import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Call API
      const data = await login({ email: email.trim().toLowerCase(), password });

      // Save token securely
      await AsyncStorage.setItem('userToken', data.token);

      // Navigate to main app
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo / App Name */}
        <View style={styles.header}>
          <Text style={styles.logo}>ReDrobe</Text>
        </View>

        {/* Sign In Title */}
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Enter your email to sign in</Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="email@domain.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* OR Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signUpText}>
            Don't have an account?{' '}
            <Text style={styles.signUpLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        {/* Terms & Privacy */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By clicking continue, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE9FB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FF84C8',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  button: {
    backgroundColor: '#FF84C8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#666',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  signUpText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  signUpLink: {
    color: '#FF84C8',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  link: {
    color: '#FF84C8',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
