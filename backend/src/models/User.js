const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String },
    notificationEnabled: { type: Boolean, default: true },
    notificationSlots: { type: [String], default: [] }, // max 3 enforced in service layer
    scheduledDeletionAt: { type: Date },
    preferences: {
      favoriteColors: { type: [String], default: [] },
      favoriteCategories: { type: [String], default: [] },
      forgottenItemThresholdDays: { type: Number, default: 30, min: 7 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
