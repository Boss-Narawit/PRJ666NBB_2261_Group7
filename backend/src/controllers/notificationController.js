const notificationService = require('../services/notification.service');

// Error → HTTP mapping for the self-handling preference endpoints (preserves the
// { message } body shape); service errors carry .status, ValidationError → 422,
// CastError → 400.
const handleError = (res, error) => {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.name === 'ValidationError') {
    return res.status(422).json({ message: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: error.message });
};

// @desc    List the user's notifications (newest first, paginated)
// @route   GET /api/notifications
// @access  Private
const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(req.user.userId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user.userId, req.params.id);
    res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getPreferences = async (req, res) => {
  try {
    const preferences = await notificationService.getPreferences(req.user.userId);
    res.status(200).json(preferences);
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update notification preferences
// @route   PATCH /api/notifications/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const preferences = await notificationService.updatePreferences(req.user.userId, req.body);
    res.status(200).json(preferences);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  listNotifications,
  markRead,
};
