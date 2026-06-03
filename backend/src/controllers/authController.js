const authService = require('../services/auth.service');

// Maps a service error to a response: explicit .status errors keep their
// message; anything unexpected is a 500 (preserves existing API contract).
const handleError = (res, err, label) => {
  if (err.status) {
    const body = { message: err.message };
    if (err.code) body.code = err.code;
    return res.status(err.status).json(body);
  }
  console.error(label, err);
  return res.status(500).json({ message: 'Server error' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, 'REGISTRATION ERROR:');
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = async (req, res) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error, 'LOGIN ERROR:');
  }
};

// @desc    Reactivate a soft-deleted account and log in
// @route   POST /api/auth/reactivate
const reactivate = async (req, res) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { email, password } = req.body;
    const result = await authService.reactivate({ email, password });
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error, 'REACTIVATE ERROR:');
  }
};

// @desc    Log out — JWT is stateless, so the client just drops the token.
// @route   POST /api/auth/logout
const logout = (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};

// @desc    Refresh token (stub)
// @route   POST /api/auth/refresh
const refresh = (req, res) => {
  res.status(200).json({ message: 'Refresh successful' });
};

// @desc    Soft-delete the authenticated user's account (BR3)
// @route   DELETE /api/auth/delete-account
const deleteAccount = async (req, res) => {
  try {
    const result = await authService.deleteAccount(req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error, 'DELETE ACCOUNT ERROR:');
  }
};

module.exports = {
  register,
  login,
  reactivate,
  logout,
  refresh,
  deleteAccount,
};
