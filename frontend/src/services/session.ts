import AsyncStorage from '@react-native-async-storage/async-storage';

// Centralizes the AsyncStorage keys for the auth session so they can't drift
// across the screens that read/write them (Login, SignUp, Profile).
const TOKEN_KEY = 'userToken';
const NAME_KEY = 'userName';
const EMAIL_KEY = 'userEmail';

export type StoredUser = { name: string; email: string };

export async function saveSession(data: {
  token: string;
  name: string;
  email: string;
}): Promise<void> {
  await AsyncStorage.setMany({
    [TOKEN_KEY]: data.token,
    [NAME_KEY]: data.name ?? '',
    [EMAIL_KEY]: data.email ?? '',
  });
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<StoredUser> {
  const map = await AsyncStorage.getMany([NAME_KEY, EMAIL_KEY]);
  return { name: map[NAME_KEY] ?? '', email: map[EMAIL_KEY] ?? '' };
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeMany([TOKEN_KEY, NAME_KEY, EMAIL_KEY]);
}
