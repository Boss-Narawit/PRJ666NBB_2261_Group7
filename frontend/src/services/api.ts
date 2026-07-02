import { Platform } from 'react-native';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000';

// Registered by AuthProvider. Called when an authenticated request comes back
// 401 — the stored token is expired or invalid, so the app signs out and
// returns to Login instead of leaving every screen in a permanent error state.
// Auth endpoints (login/register/reactivate) never call this: their 401s mean
// bad credentials, not a dead session.
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

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
  return data; // Returns flat { _id, name, email, token }
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

  if (res.status === 401) onUnauthorized?.();
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

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');
  return data;
}

export async function updateProfile(
  token: string,
  payload: {
    name?: string;
    email?: string;
    forgottenItemThresholdDays?: number;
  },
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

  if (res.status === 401) onUnauthorized?.();
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

  if (res.status === 401) onUnauthorized?.();
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

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok)
    throw new Error(
      data.message || 'Failed to update notification preferences',
    );
  return data;
}
export interface AppNotification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface DashboardSummary {
  userName: string;
  totalItems: number;
  wornThisMonth: number;
  forgottenCount: number;
  forgottenItems: {
    _id: string;
    name: string;
    brand: string;
    imageUrl: string;
    analytics?: {
      lastWornAt?: string;
    };
  }[];
}

export interface Clothing {
  _id: string;
  name: string;
  brand: string;
  category: string;
  colors: string[];
  size: string;
  imageUrl: string;
  condition: string;
  status: string;
  notes?: string;
  analytics?: {
    wearCount?: number;
    lastWornAt?: string;
  };
  // Set when status is 'Exported' — where the item went (see export.service).
  exportInfo?: {
    partnerName?: string;
    type?: string;
    exportedAt?: string;
  };
  createdAt?: string;
}

export async function getClothing(token: string): Promise<Clothing[]> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/clothing`, {
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

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok)
    throw new Error(data.message || data.error || 'Failed to fetch wardrobe');
  return data;
}

export async function getClothingById(
  token: string,
  id: string,
): Promise<Clothing> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/clothing/${id}`, {
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

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok)
    throw new Error(data.message || data.error || 'Failed to fetch item');
  return data;
}

// Uploads a picked photo to Cloudinary via the backend and returns the hosted
// secure_url. Uses an inline multipart fetch (NOT apiFetch, which forces a JSON
// Content-Type) — the runtime must set the multipart boundary itself. The field
// name 'image' matches the server's upload.single('image').
export async function uploadClothingImage(
  token: string,
  photo: {
    uri?: string | null;
    type?: string | null;
    fileName?: string | null;
  },
): Promise<string> {
  if (!photo.uri) throw new Error('No photo selected');
  const form = new FormData();
  form.append('image', {
    uri: photo.uri,
    type: photo.type || 'image/jpeg',
    name: photo.fileName || 'photo.jpg',
  } as any);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/clothing/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok)
    throw new Error(data.message || data.error || 'Image upload failed');
  return data.imageUrl;
}

// Raw values straight from the Add form. createClothing reconciles them to the
// Clothing model at the API boundary (same pattern as updateClothing).
export interface NewClothingInput {
  name: string;
  brand: string;
  category: string; // display label, e.g. 'Tops' / 'Activewear'
  color: string; // comma-separated, e.g. 'Black, White'
  size: string;
  imageUrl: string; // hosted URL from uploadClothingImage
  condition?: string; // defaults to 'Good'
  notes?: string;
}

// Form category labels → Clothing enum (lowercase). The form offers 'Activewear',
// which has no model enum, so it maps to 'other'.
const CATEGORY_MAP: Record<string, string> = {
  tops: 'tops',
  bottoms: 'bottoms',
  dresses: 'dresses',
  outerwear: 'outerwear',
  shoes: 'shoes',
  accessories: 'accessories',
  activewear: 'other',
  other: 'other',
};

export function createClothing(
  token: string,
  input: NewClothingInput,
): Promise<Clothing> {
  const body = {
    name: input.name.trim(),
    brand: input.brand.trim(),
    category: CATEGORY_MAP[input.category.toLowerCase()] ?? 'other',
    colors: input.color
      .split(',')
      .map(c => c.trim())
      .filter(Boolean),
    size: input.size,
    imageUrl: input.imageUrl,
    condition: input.condition ?? 'Good',
    notes: input.notes?.trim() || undefined,
  };
  return apiFetch<Clothing>('/api/clothing/upload', token, {
    method: 'POST',
    body,
  });
}

// Editable fields the ItemDetail screen can PATCH. Values must already match the
// Clothing model's enums (category lowercase, condition Excellent/Good/Fair/Damaged,
// status Available/Archived).
export type ClothingUpdate = Partial<
  Pick<
    Clothing,
    | 'name'
    | 'brand'
    | 'category'
    | 'colors'
    | 'size'
    | 'condition'
    | 'notes'
    | 'status'
  >
>;

export function updateClothing(
  token: string,
  id: string,
  payload: ClothingUpdate,
): Promise<Clothing> {
  return apiFetch<Clothing>(`/api/clothing/${id}`, token, {
    method: 'PATCH',
    body: payload,
  });
}

export interface WearLog {
  _id: string;
  logDate: string;
  occasion?: string;
  notes?: string;
  clothingWorn: {
    _id: string;
    itemId: {
      _id: string;
      name: string;
      brand: string;
      category: string;
      imageUrl: string;
      analytics?: { wearCount?: number };
    } | null;
  }[];
}

export interface WearLogList {
  wearLogs: WearLog[];
  total: number;
  page: number;
  limit: number;
}

export async function getWearLogs(
  token: string,
  page = 1,
  range?: { startDate?: string; endDate?: string },
): Promise<WearLogList> {
  const params = new URLSearchParams({ page: String(page) });
  if (range?.startDate) params.set('startDate', range.startDate);
  if (range?.endDate) params.set('endDate', range.endDate);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/wear-logs?${params.toString()}`, {
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

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok)
    throw new Error(data.message || data.error || 'Failed to fetch wear logs');
  return data;
}

export interface CreateWearLogPayload {
  logDate: string;
  clothingWorn: { itemId: string }[];
  occasion?: string;
  notes?: string;
}

// Throws an Error with `.status === 409` when a log already exists for the day (BR8).
export function createWearLog(
  token: string,
  payload: CreateWearLogPayload,
): Promise<{ _id: string }> {
  return apiFetch<{ _id: string }>('/api/wear-logs', token, {
    method: 'POST',
    body: payload,
  });
}

export function getWearLogById(token: string, id: string): Promise<WearLog> {
  return apiFetch<WearLog>(`/api/wear-logs/${id}`, token);
}

// Partial update (BR10). Throws an Error with `.status === 409` when logDate is
// moved onto a day that already has a log (BR8).
export interface UpdateWearLogPayload {
  logDate?: string;
  clothingWorn?: { itemId: string }[];
  occasion?: string;
  notes?: string;
}

export function updateWearLog(
  token: string,
  id: string,
  payload: UpdateWearLogPayload,
): Promise<WearLog> {
  return apiFetch<WearLog>(`/api/wear-logs/${id}`, token, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteWearLog(
  token: string,
  id: string,
): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/api/wear-logs/${id}`, token, {
    method: 'DELETE',
  });
}

export async function getDashboardSummary(
  token: string,
): Promise<DashboardSummary> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/dashboard/summary`, {
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

  if (res.status === 401) onUnauthorized?.();
  // errorHandler-mapped errors arrive as { error }, not { message }
  if (!res.ok)
    throw new Error(
      data.message || data.error || 'Failed to fetch dashboard summary',
    );
  return data;
}

export async function getNotifications(
  token: string,
  page = 1,
): Promise<NotificationList> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/notifications?page=${page}`, {
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

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok)
    throw new Error(
      data.message || data.error || 'Failed to fetch notifications',
    );
  return data;
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<AppNotification> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (res.status === 401) onUnauthorized?.();
  if (!res.ok)
    throw new Error(
      data.message || data.error || 'Failed to mark notification as read',
    );
  return data;
}

// ── Shared fetch helper (used by the export / forgotten / thoughtful-purchase
// endpoints below). Older functions above keep their inline form. Reads both
// error shapes: self-handled controllers return { message }, errorHandler { error }.
async function apiFetch<T>(
  path: string,
  token: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: `Server error (${res.status})` };

  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    const err: any = new Error(data.message || data.error || 'Request failed');
    err.status = res.status; // lets callers branch on the HTTP code (e.g. 409 BR8)
    throw err;
  }
  return data as T;
}

// ── Partners (export destinations) ──────────────────────────────────────────
export interface Partner {
  _id: string;
  name: string;
  type: 'resale' | 'donation' | 'tailor' | 'upcycle';
  website?: string;
  description?: string;
  isActive: boolean;
}

export function listPartners(
  token: string,
  type?: 'resale' | 'donation',
): Promise<Partner[]> {
  const query = type ? `?type=${type}` : '';
  return apiFetch<Partner[]>(`/api/partners${query}`, token);
}

// ── Export clothing ─────────────────────────────────────────────────────────
export interface ExportPayload {
  clothingId: string;
  partnerId: string;
  checklistCompleted: boolean;
  consent: boolean;
  selectedFields: string[];
  price?: number;
  description?: string;
}

export interface ExportRecord {
  _id: string;
  type: string;
  status: string;
  price?: number;
  createdAt: string;
  clothingId: { _id: string; name: string; brand: string; imageUrl: string };
  partnerId?: { _id: string; name: string; type: string };
}

export function exportResale(
  token: string,
  payload: ExportPayload,
): Promise<ExportRecord> {
  return apiFetch<ExportRecord>('/api/exports/resale', token, {
    method: 'POST',
    body: payload,
  });
}

export function exportDonation(
  token: string,
  payload: ExportPayload,
): Promise<ExportRecord> {
  return apiFetch<ExportRecord>('/api/exports/donation', token, {
    method: 'POST',
    body: payload,
  });
}

export function getExportHistory(token: string): Promise<ExportRecord[]> {
  return apiFetch<ExportRecord[]>('/api/exports/history', token);
}

// ── Forgotten items ─────────────────────────────────────────────────────────
export function getForgottenItems(token: string): Promise<Clothing[]> {
  return apiFetch<Clothing[]>('/api/clothing/forgotten-items', token);
}

// ── Thoughtful purchasing ───────────────────────────────────────────────────
export interface ThoughtfulPurchase {
  _id: string;
  itemName: string;
  description?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  sourceUrl?: string;
  cooldownEndsAt: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PurchasePayload {
  itemName: string;
  cooldownMinutes: number;
  description?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  sourceUrl?: string;
}

export function getPurchases(token: string): Promise<ThoughtfulPurchase[]> {
  return apiFetch<ThoughtfulPurchase[]>('/api/thoughtful-purchase', token);
}

export function createPurchase(
  token: string,
  payload: PurchasePayload,
): Promise<ThoughtfulPurchase> {
  return apiFetch<ThoughtfulPurchase>('/api/thoughtful-purchase', token, {
    method: 'POST',
    body: payload,
  });
}

export function approvePurchase(
  token: string,
  id: string,
): Promise<ThoughtfulPurchase> {
  return apiFetch<ThoughtfulPurchase>(
    `/api/thoughtful-purchase/approve/${id}`,
    token,
    { method: 'PATCH' },
  );
}

export function rejectPurchase(
  token: string,
  id: string,
): Promise<ThoughtfulPurchase> {
  return apiFetch<ThoughtfulPurchase>(
    `/api/thoughtful-purchase/reject/${id}`,
    token,
    { method: 'PATCH' },
  );
}
