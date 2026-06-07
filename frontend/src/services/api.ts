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

  if (!res.ok) {
    const err: any = new Error(data.message || 'Registration failed');
    // Soft-deleted email: lets the UI route the user to login to reactivate.
    if (data.code) err.code = data.code;
    throw err;
  }
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

  if (!res.ok) {
    const err: any = new Error(data.message || 'Login failed');
    // Soft-deleted account: lets the UI offer reactivation instead of a plain error.
    if (data.code) err.code = data.code;
    throw err;
  }
  return data; // Returns { token, user }
}

export async function reactivate(payload: { email: string; password: string }) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/auth/reactivate`, {
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

  if (!res.ok) throw new Error(data.message || 'Reactivation failed');
  return data; // Returns { _id, name, email, token }
}

export async function deleteAccount(token: string) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/auth/delete-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok) throw new Error(data.message || 'Failed to delete account');
  return data;
}

export async function getProfile(token: string) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');
  return data;
}

export async function updateProfile(
  token: string,
  payload: { name: string; email?: string },
) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok) throw new Error(data.message || 'Failed to update profile');
  return data;
}

export interface NotificationPreferences {
  notificationEnabled: boolean;
  notificationFrequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  itemStatusChangeEnabled: boolean;
  forgottenItemAlertEnabled: boolean;
}

export async function getNotificationPreferences(
  token: string,
): Promise<NotificationPreferences> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/notifications/preferences`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok)
    throw new Error(data.message || 'Failed to fetch notification preferences');
  return data;
}

export async function updateNotificationPreferences(
  token: string,
  payload: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/notifications/preferences`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok)
    throw new Error(
      data.message || 'Failed to update notification preferences',
    );
  return data;
}
