const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Fail fast: never sign or verify with a hardcoded fallback secret.
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
};

const generateToken = (userId) =>
  jwt.sign({ userId }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

// Register a new user. Throws .status=400 if the email is already taken (BR1);
// other Mongoose errors (e.g. missing required field) bubble up unchanged.
const register = async ({ name, email, password }) => {
  if (!email || !email.includes('@') || !email.includes('.')) {
    const err = new Error('Please provide a valid email address');
    err.status = 400;
    throw err;
  }
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    // Soft-deleted account (BR3): the row lingers until purge, which would
    // otherwise dead-end re-registration. Signal the UI to send them to login
    // (where their real password can reactivate it) instead of "already exists".
    if (userExists.scheduledDeletionAt) {
      const err = new Error('This account has been deleted. Sign in to reactivate it.');
      err.status = 403;
      err.code = 'ACCOUNT_PENDING_DELETION';
      throw err;
    }
    const err = new Error('User already exists');
    err.status = 400;
    throw err;
  }

  const user = await User.create({ name, email, password });
  return authResponse(user);
};

// Authenticate a user. Throws .status=401 on unknown email or wrong password.
const authResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  token: generateToken(user._id),
});

// Verifies credentials; throws 401 on bad creds. Returns the user doc so callers
// can inspect deletion state.
const verifyCredentials = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  return user;
};

const login = async ({ email, password }) => {
  const user = await verifyCredentials({ email, password });

  // Soft-deleted account (BR3): valid creds, but signal the caller to offer
  // reactivation instead of issuing a token.
  if (user.scheduledDeletionAt) {
    const err = new Error('This account has been deleted.');
    err.status = 403;
    err.code = 'ACCOUNT_PENDING_DELETION';
    throw err;
  }

  return authResponse(user);
};

// Cancels a pending deletion after re-verifying credentials, then logs in.
const reactivate = async ({ email, password }) => {
  const user = await verifyCredentials({ email, password });
  if (user.scheduledDeletionAt) {
    await User.findByIdAndUpdate(user._id, { $unset: { scheduledDeletionAt: '' } });
  }
  return authResponse(user);
};

// BR3: soft-delete — mark the account; purgeUsers job hard-deletes after 30 days.
const deleteAccount = async (userId) => {
  await User.findByIdAndUpdate(userId, { scheduledDeletionAt: new Date() });
  return { message: 'Account scheduled for deletion' };
};

module.exports = { register, login, reactivate, deleteAccount, generateToken };
