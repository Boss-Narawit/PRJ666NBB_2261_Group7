const User = require('../models/User');

// GET /api/users/me — returns the full user document; the frontend reads
// preferences (e.g. forgottenItemThresholdDays) directly off it.
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }
  return user;
};

// PATCH /api/users/me — only name/avatar/forgottenItemThresholdDays are
// writable; email is intentionally ignored. BR12 (min 7) is enforced by the
// schema `min` on the threshold, which rejects out-of-range values via a
// ValidationError on save (→ 422 in the controller).
const updateMe = async (userId, data) => {
  const { name, avatar, forgottenItemThresholdDays } = data;

  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (forgottenItemThresholdDays !== undefined) {
    user.preferences.forgottenItemThresholdDays = forgottenItemThresholdDays;
  }

  const updated = await user.save();
  return {
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    avatar: updated.avatar,
    preferences: updated.preferences,
  };
};

module.exports = { getMe, updateMe };
