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
const CLOTHING_STATUSES = Object.freeze(['Available', 'Archived', 'Exported']);

const USER_ROLES = Object.freeze(['user', 'admin']);

const PURCHASE_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);

const NOTIFICATION_TYPES = Object.freeze([
  'forgotten_item',
  'cooldown_reminder',
  'similarity_alert',
  'recap_ready',
  'export_update',
  'repair_reminder',
  'repurpose_suggestion',
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
const REPURPOSE_UNWORN_DAYS = 180; // idle-item threshold for the repurpose (resell/donate) nudge
const ANNUAL_RECAP_MIN_LOGS = 1; // TEMP: lowered for demo — BR25 is 30, revert before submission
const DELETE_GRACE_PERIOD_DAYS = 30; // BR3
const MAX_CLOTHING_BATCH = 50; // BR5
const DASHBOARD_FORGOTTEN_PREVIEW_LIMIT = 5; // forgotten-items preview on main dashboard
const NOTIFICATION_PAGE_SIZE = 20; // default + max page size for the notification list
const WEARLOG_PAGE_SIZE = 20; // default + max page size for the wear-log history list
const UPLOAD_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // image upload cap — file buffers in memory before Cloudinary
const CRON_TIMEZONE = 'America/Toronto'; // node-cron defaults to the host TZ — pin BR11's "daily 08:00" to local time
// Cost 10 in production; 4 under Jest — hashing dominates suite runtime otherwise
// (~56ms/register at cost 10). Login/compare still verify: bcrypt embeds the cost
// in the hash, so mixed-cost hashes coexist safely.
const BCRYPT_SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 10;

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
  REPURPOSE_UNWORN_DAYS,
  ANNUAL_RECAP_MIN_LOGS,
  DELETE_GRACE_PERIOD_DAYS,
  MAX_CLOTHING_BATCH,
  DASHBOARD_FORGOTTEN_PREVIEW_LIMIT,
  NOTIFICATION_PAGE_SIZE,
  WEARLOG_PAGE_SIZE,
  UPLOAD_MAX_FILE_SIZE_BYTES,
  CRON_TIMEZONE,
  BCRYPT_SALT_ROUNDS,
};
