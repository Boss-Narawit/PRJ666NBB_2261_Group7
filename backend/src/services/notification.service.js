const Notification = require('../models/Notification');
const User = require('../models/User');
const { NOTIFICATION_PAGE_SIZE, NOTIFICATION_MAX_SLOTS } = require('../config/constants');

const listNotifications = async (userId, { page, limit } = {}) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || NOTIFICATION_PAGE_SIZE, 1),
    NOTIFICATION_PAGE_SIZE
  );

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { notifications, total, unreadCount, page: safePage, limit: safeLimit };
};

// Notifications are immutable — only isRead may be flipped.
const markRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) {
    const e = new Error('Notification not found');
    e.status = 404;
    throw e;
  }
  return notification;
};

// GET /api/notifications/preferences — the user's notification settings, with
// safe defaults for unset preference sub-fields.
const getPreferences = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }
  return {
    notificationEnabled: user.notificationEnabled,
    notificationFrequency: user.preferences.notificationFrequency || 'Daily',
    itemStatusChangeEnabled: user.preferences.itemStatusChangeEnabled !== false,
    forgottenItemAlertEnabled: user.preferences.forgottenItemAlertEnabled !== false,
    notificationSlots: user.notificationSlots ?? [],
  };
};

// PATCH /api/notifications/preferences — partial update of notification settings.
const updatePreferences = async (userId, data) => {
  const {
    notificationEnabled,
    notificationFrequency,
    itemStatusChangeEnabled,
    forgottenItemAlertEnabled,
    notificationSlots,
  } = data;

  // BR27: at most NOTIFICATION_MAX_SLOTS notification time slots per day.
  // Validate shape up front — a non-string entry would otherwise CastError on
  // save, which reads as a server fault rather than bad input.
  if (notificationSlots !== undefined) {
    if (
      !Array.isArray(notificationSlots) ||
      notificationSlots.some((slot) => typeof slot !== 'string')
    ) {
      const e = new Error('notificationSlots must be an array of strings');
      e.status = 422;
      throw e;
    }
    if (notificationSlots.length > NOTIFICATION_MAX_SLOTS) {
      const e = new Error(`At most ${NOTIFICATION_MAX_SLOTS} notification slots are allowed`);
      e.status = 422;
      throw e;
    }
  }

  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }

  if (notificationEnabled !== undefined) {
    user.notificationEnabled = notificationEnabled;
  }
  if (notificationFrequency !== undefined) {
    user.preferences.notificationFrequency = notificationFrequency;
  }
  if (itemStatusChangeEnabled !== undefined) {
    user.preferences.itemStatusChangeEnabled = itemStatusChangeEnabled;
  }
  if (forgottenItemAlertEnabled !== undefined) {
    user.preferences.forgottenItemAlertEnabled = forgottenItemAlertEnabled;
  }
  if (notificationSlots !== undefined) {
    user.notificationSlots = notificationSlots;
  }

  await user.save();

  return {
    notificationEnabled: user.notificationEnabled,
    notificationFrequency: user.preferences.notificationFrequency,
    itemStatusChangeEnabled: user.preferences.itemStatusChangeEnabled,
    forgottenItemAlertEnabled: user.preferences.forgottenItemAlertEnabled,
    notificationSlots: user.notificationSlots,
  };
};

module.exports = { listNotifications, markRead, getPreferences, updatePreferences };
