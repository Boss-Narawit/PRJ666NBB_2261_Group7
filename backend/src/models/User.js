const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const {
  USER_ROLES,
  FORGOTTEN_ITEM_MIN_THRESHOLD_DAYS,
  FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS,
  BCRYPT_SALT_ROUNDS,
} = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    avatar: { type: String },
    notificationEnabled: { type: Boolean, default: true },
    notificationSlots: { type: [String], default: [] }, // max 3 enforced in service layer
    scheduledDeletionAt: { type: Date },
    preferences: {
      favoriteColors: { type: [String], default: [] },
      favoriteCategories: { type: [String], default: [] },
      forgottenItemThresholdDays: {
        type: Number,
        default: FORGOTTEN_ITEM_DEFAULT_THRESHOLD_DAYS,
        min: FORGOTTEN_ITEM_MIN_THRESHOLD_DAYS,
      },
      notificationFrequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly'],
        default: 'Daily',
      },
      itemStatusChangeEnabled: { type: Boolean, default: true },
      forgottenItemAlertEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ scheduledDeletionAt: 1 }, { sparse: true }); // sparse: most users never set this

module.exports = mongoose.model('User', userSchema);
