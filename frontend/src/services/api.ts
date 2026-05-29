import { Platform } from 'react-native';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000';

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
}

export async function login(payload: { email: string; password: string }) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data; // Returns { token, user }
}
