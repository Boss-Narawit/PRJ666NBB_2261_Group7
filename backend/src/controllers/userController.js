const userService = require('../services/user.service');

// Error → HTTP mapping shared by both handlers, matching the sibling
// controllers: service errors carry .status; Mongoose ValidationError → 422
// (BR12 threshold), CastError → 400.
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

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await userService.getMe(req.user.userId);
    res.status(200).json(user);
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update current user profile
// @route   PATCH /api/users/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const user = await userService.updateMe(req.user.userId, req.body);
    res.status(200).json(user);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getMe,
  updateMe,
};
