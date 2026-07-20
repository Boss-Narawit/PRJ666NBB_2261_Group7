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

// Unauthenticated auth endpoints: no Bearer token, and a 401 here means bad
// credentials — never a dead session — so onUnauthorized is NOT called. Copies
// data.code onto the error (e.g. ACCOUNT_PENDING_DELETION) for UI branching.
async function authFetch(path: string, payload: unknown, fallback: string) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
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
    const err: any = new Error(data.message || fallback);
    // Soft-deleted account: lets the UI route to reactivation instead of a plain error.
    if (data.code) err.code = data.code;
    throw err;
  }
  return data;
}

export function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return authFetch('/api/auth/register', payload, 'Registration failed');
}

// Returns flat { _id, name, email, token }
export function login(payload: { email: string; password: string }) {
  return authFetch('/api/auth/login', payload, 'Login failed');
}

// Returns { _id, name, email, token }
export function reactivate(payload: { email: string; password: string }) {
  return authFetch('/api/auth/reactivate', payload, 'Reactivation failed');
}

export function deleteAccount(token: string) {
  return apiFetch('/api/auth/delete-account', token, {
    method: 'DELETE',
    fallback: 'Failed to delete account',
  });
}

export function getProfile(token: string) {
  return apiFetch<any>('/api/users/me', token, {
    fallback: 'Failed to fetch profile',
  });
}

export function updateProfile(
  token: string,
  payload: {
    name?: string;
    email?: string;
    forgottenItemThresholdDays?: number;
  },
) {
  return apiFetch<any>('/api/users/me', token, {
    method: 'PATCH',
    body: payload,
    fallback: 'Failed to update profile',
  });
}

export interface NotificationPreferences {
  notificationEnabled: boolean;
  notificationFrequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  itemStatusChangeEnabled: boolean;
  forgottenItemAlertEnabled: boolean;
}

export function getNotificationPreferences(
  token: string,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>(
    '/api/notifications/preferences',
    token,
    { fallback: 'Failed to fetch notification preferences' },
  );
}

export function updateNotificationPreferences(
  token: string,
  payload: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>(
    '/api/notifications/preferences',
    token,
    {
      method: 'PATCH',
      body: payload,
      fallback: 'Failed to update notification preferences',
    },
  );
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
  // BR24 utilization: % of Available items worn in the trailing window
  utilizationRate: number;
  wornInWindow: number;
  utilizationWindowDays: number;
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

export function getClothing(token: string): Promise<Clothing[]> {
  return apiFetch<Clothing[]>('/api/clothing', token, {
    fallback: 'Failed to fetch wardrobe',
  });
}

export function getClothingById(token: string, id: string): Promise<Clothing> {
  return apiFetch<Clothing>(`/api/clothing/${id}`, token, {
    fallback: 'Failed to fetch item',
  });
}

export interface PickedPhoto {
  uri?: string | null;
  type?: string | null;
  fileName?: string | null;
}

// Multipart POST of a picked photo, shared by the upload and similarity-check
// fetchers. Inline fetch (NOT apiFetch, which forces a JSON Content-Type) — the
// runtime must set the multipart boundary itself. The field name 'image'
// matches the server's upload.single('image'). Returns the parsed JSON body.
async function postPhoto(
  path: string,
  token: string,
  photo: PickedPhoto,
  extraFields: Record<string, string>,
  fallbackError: string,
): Promise<any> {
  if (!photo.uri) throw new Error('No photo selected');
  const form = new FormData();
  form.append('image', {
    uri: photo.uri,
    type: photo.type || 'image/jpeg',
    name: photo.fileName || 'photo.jpg',
  } as any);
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
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
  if (!res.ok) throw new Error(data.message || data.error || fallbackError);
  return data;
}

// Uploads a picked photo to Cloudinary via the backend and returns the hosted
// secure_url.
export async function uploadClothingImage(
  token: string,
  photo: PickedPhoto,
): Promise<string> {
  const data = await postPhoto(
    '/api/clothing/upload-image',
    token,
    photo,
    {},
    'Image upload failed',
  );
  return data.imageUrl;
}

// Best wardrobe match from the AI similarity check. `score` is true cosine
// similarity in [0,1] (clamped at 0 for anti-correlated vectors) — multiply by
// 100 for display.
export interface SimilarityMatch {
  id: string;
  name: string;
  imageUrl: string;
  score: number;
}

// Runs the AI similarity check: uploads the picked photo and returns the single
// closest wardrobe item unconditionally (the client owns the ≥70% messaging),
// or null when nothing in the wardrobe has an embedding.
export async function checkSimilarity(
  token: string,
  photo: PickedPhoto,
): Promise<SimilarityMatch | null> {
  const data = await postPhoto(
    '/api/similarity/check',
    token,
    photo,
    {},
    'Similarity check failed',
  );
  return data.match ?? null;
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

// Reconcile a form-shaped input to the Clothing model's field shape at the API
// boundary (category→enum, comma color→colors[], condition default). Shared by
// the single- and batch-create paths so both stay consistent.
function toClothingBody(input: NewClothingInput) {
  return {
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
}

export function createClothing(
  token: string,
  input: NewClothingInput,
): Promise<Clothing> {
  return apiFetch<Clothing>('/api/clothing/upload', token, {
    method: 'POST',
    body: toClothingBody(input),
  });
}

// Batch add (BR5: max 50 per request). Posts an array to the bulk endpoint.
export function bulkCreateClothing(
  token: string,
  items: NewClothingInput[],
): Promise<Clothing[]> {
  return apiFetch<Clothing[]>('/api/clothing/bulk-upload', token, {
    method: 'POST',
    body: items.map(toClothingBody),
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
  outfitName?: string;
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

export function getWearLogs(
  token: string,
  page = 1,
  range?: { startDate?: string; endDate?: string },
): Promise<WearLogList> {
  const params = new URLSearchParams({ page: String(page) });
  if (range?.startDate) params.set('startDate', range.startDate);
  if (range?.endDate) params.set('endDate', range.endDate);
  return apiFetch<WearLogList>(`/api/wear-logs?${params.toString()}`, token, {
    fallback: 'Failed to fetch wear logs',
  });
}

export interface CreateWearLogPayload {
  logDate: string;
  clothingWorn: { itemId: string }[];
  outfitName?: string;
  occasion?: string;
  notes?: string;
}

// Creates a new wear log. Multiple logs per day are allowed (BR8), so this no
// longer 409s on a same-day log.
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

// Partial update (BR10). Multiple logs per day are allowed (BR8), so moving a
// log onto an already-occupied day no longer 409s.
export interface UpdateWearLogPayload {
  logDate?: string;
  clothingWorn?: { itemId: string }[];
  outfitName?: string;
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

export function getDashboardSummary(token: string): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/api/dashboard/summary', token, {
    fallback: 'Failed to fetch dashboard summary',
  });
}

export function getNotifications(
  token: string,
  page = 1,
): Promise<NotificationList> {
  return apiFetch<NotificationList>(`/api/notifications?page=${page}`, token, {
    fallback: 'Failed to fetch notifications',
  });
}

export function markNotificationRead(
  token: string,
  id: string,
): Promise<AppNotification> {
  return apiFetch<AppNotification>(`/api/notifications/${id}/read`, token, {
    method: 'PATCH',
    fallback: 'Failed to mark notification as read',
  });
}

// ── Shared fetch helper — every authenticated JSON endpoint goes through here
// (only uploadClothingImage stays inline: multipart body). Reads both error
// shapes: self-handled controllers return { message }, errorHandler { error }.
async function apiFetch<T>(
  path: string,
  token: string,
  options: { method?: string; body?: unknown; fallback?: string } = {},
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
    const err: any = new Error(
      data.message || data.error || options.fallback || 'Request failed',
    );
    err.status = res.status; // lets callers branch on the HTTP code (e.g. 409 BR8)
    if (data.code) err.code = data.code; // machine-readable code, when the API sends one
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
  location?: string; // local shops (tailor/upcycle directory)
  isActive: boolean;
}

export function listPartners(
  token: string,
  type?: Partner['type'],
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

// ── Annual style recap ──────────────────────────────────────────────────────
export interface RecapItem {
  rank: number;
  id: string;
  name: string;
  imageUrl: string;
  wearCount: number;
}

export interface AnnualRecap {
  year: number;
  totalClothingItems: number;
  totalOutfits: number;
  totalWearCount: number;
  topItems: RecapItem[];
  activeItems: number;
  utilizationRate: number;
  mostWornItem: RecapItem | null;
}

// Throws with err.status === 422 (code RECAP_NOT_ENOUGH_LOGS) when the user
// hasn't logged enough outfits for the year — the screen branches on that.
// `year` opens a specific (e.g. completed) year; omitted = live current year.
export function getAnnualRecap(
  token: string,
  year?: number,
): Promise<AnnualRecap> {
  const query = year != null ? `?year=${year}` : '';
  return apiFetch<AnnualRecap>(`/api/analytics/annual-recap${query}`, token);
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
