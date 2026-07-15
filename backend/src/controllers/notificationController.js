const User = require('../models/User');
const notificationService = require('../services/notification.service');
const { NOTIFICATION_MAX_SLOTS } = require('../config/constants');

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
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      notificationEnabled: user.notificationEnabled,
      notificationFrequency: user.preferences.notificationFrequency || 'Daily',
      itemStatusChangeEnabled: user.preferences.itemStatusChangeEnabled !== false,
      forgottenItemAlertEnabled: user.preferences.forgottenItemAlertEnabled !== false,
      notificationSlots: user.notificationSlots ?? [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update notification preferences
// @route   PATCH /api/notifications/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const {
      notificationEnabled,
      notificationFrequency,
      itemStatusChangeEnabled,
      forgottenItemAlertEnabled,
      notificationSlots,
    } = req.body;

    // BR27: at most NOTIFICATION_MAX_SLOTS notification time slots per day.
    if (notificationSlots !== undefined) {
      // Entries must be strings — an object entry would throw a CastError on
      // save, which this controller's catch maps to 500, not 422.
      if (
        !Array.isArray(notificationSlots) ||
        notificationSlots.some((slot) => typeof slot !== 'string')
      ) {
        return res.status(422).json({ message: 'notificationSlots must be an array of strings' });
      }
      if (notificationSlots.length > NOTIFICATION_MAX_SLOTS) {
        return res.status(422).json({
          message: `At most ${NOTIFICATION_MAX_SLOTS} notification slots are allowed`,
        });
      }
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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

    res.status(200).json({
      notificationEnabled: user.notificationEnabled,
      notificationFrequency: user.preferences.notificationFrequency,
      itemStatusChangeEnabled: user.preferences.itemStatusChangeEnabled,
      forgottenItemAlertEnabled: user.preferences.forgottenItemAlertEnabled,
      notificationSlots: user.notificationSlots,
    });
  } catch (error) {
    // An out-of-enum frequency is bad input, not a server fault.
    if (error.name === 'ValidationError') {
      return res.status(422).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  listNotifications,
  markRead,
};
