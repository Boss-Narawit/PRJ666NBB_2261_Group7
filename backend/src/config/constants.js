// Enums — imported by models and validators; single source of truth
const CLOTHING_CATEGORIES = Object.freeze([
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'other',
]);
const CLOTHING_CONDITIONS = Object.freeze(['Excellent', 'Good', 'Fair', 'Damaged']);
const CLOTHING_STATUSES = Object.freeze(['Available', 'Archived']);

const USER_ROLES = Object.freeze(['user', 'admin']);

const PURCHASE_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);

const NOTIFICATION_TYPES = Object.freeze([
  'forgotten_item',
  'cooldown_reminder',
  'similarity_alert',
  'recap_ready',
  'export_update',
]);

const EXPORT_TYPES = Object.freeze(['sale', 'donation', 'upcycle', 'resale']);
const EXPORT_STATUSES = Object.freeze(['active', 'sold', 'donated', 'removed']);

const OUTFIT_SEASONS = Object.freeze(['spring', 'summer', 'fall', 'winter', 'all']);
const PARTNER_TYPES = Object.freeze(['resale', 'donation', 'tailor', 'upcycle']); // lowercase — matches EXPORT_TYPES convention

// Business-rule thresholds — never hardcode these in services or validators
const COOLDOWN_MIN_MINUTES = 1440; // BR14
const SIMILARITY_THRESHOLD = 0.7; // BR16
const NOTIFICATION_MAX_SLOTS = 3; // BR27
const FORGOTTEN_ITEM_MIN_THRESHOLD_DAYS = 7; // BR12
const FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS = 30; // default preference value
const FORGOTTEN_ITEM_RENOTIFY_DAYS = 7; // BR13
const UTILIZATION_WINDOW_DAYS = 90; // BR24
const ANNUAL_RECAP_MIN_LOGS = 30; // BR25
const DELETE_GRACE_PERIOD_DAYS = 30; // BR3
const MAX_CLOTHING_BATCH = 50; // BR5
const DASHBOARD_FORGOTTEN_PREVIEW_LIMIT = 5; // forgotten-items preview on main dashboard
const NOTIFICATION_PAGE_SIZE = 20; // default + max page size for the notification list
const WEARLOG_PAGE_SIZE = 20; // default + max page size for the wear-log history list

module.exports = {
  CLOTHING_CATEGORIES,
  CLOTHING_CONDITIONS,
  CLOTHING_STATUSES,
  USER_ROLES,
  PURCHASE_STATUSES,
  NOTIFICATION_TYPES,
  EXPORT_TYPES,
  EXPORT_STATUSES,
  OUTFIT_SEASONS,
  PARTNER_TYPES,
  COOLDOWN_MIN_MINUTES,
  SIMILARITY_THRESHOLD,
  NOTIFICATION_MAX_SLOTS,
  FORGOTTEN_ITEM_MIN_THRESHOLD_DAYS,
  FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS,
  FORGOTTEN_ITEM_RENOTIFY_DAYS,
  UTILIZATION_WINDOW_DAYS,
  ANNUAL_RECAP_MIN_LOGS,
  DELETE_GRACE_PERIOD_DAYS,
  MAX_CLOTHING_BATCH,
  DASHBOARD_FORGOTTEN_PREVIEW_LIMIT,
  NOTIFICATION_PAGE_SIZE,
  WEARLOG_PAGE_SIZE,
};
