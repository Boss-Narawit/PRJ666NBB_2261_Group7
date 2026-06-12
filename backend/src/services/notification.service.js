const Notification = require('../models/Notification');
const { NOTIFICATION_PAGE_SIZE } = require('../config/constants');

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

module.exports = { listNotifications, markRead };
