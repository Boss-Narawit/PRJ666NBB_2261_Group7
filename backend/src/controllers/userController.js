const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update current user profile
// @route   PATCH /api/users/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const { name, avatar, forgottenItemThresholdDays } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    // BR12 (min 7) enforced by the schema `min` on this field — an out-of-range
    // value rejects via ValidationError on save.
    if (forgottenItemThresholdDays !== undefined) {
      user.preferences.forgottenItemThresholdDays = forgottenItemThresholdDays;
    }

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMe,
  updateMe,
};
