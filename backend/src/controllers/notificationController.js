const User = require('../models/User');

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
    } = req.body;

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

    await user.save();

    res.status(200).json({
      notificationEnabled: user.notificationEnabled,
      notificationFrequency: user.preferences.notificationFrequency,
      itemStatusChangeEnabled: user.preferences.itemStatusChangeEnabled,
      forgottenItemAlertEnabled: user.preferences.forgottenItemAlertEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
};
