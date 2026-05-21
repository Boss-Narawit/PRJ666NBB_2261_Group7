const mongoose = require('mongoose');
const { EXPORT_TYPES, EXPORT_STATUSES } = require('../config/constants');

const exportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clothingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clothing', required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    type: { type: String, required: true, enum: EXPORT_TYPES },
    price: { type: Number }, // applicable when type is 'sale' or 'resale'
    description: { type: String, trim: true },
    status: { type: String, enum: EXPORT_STATUSES, default: 'active' },
    checklistCompleted: { type: Boolean, default: false }, // BR17/BR20
    consent: { type: Boolean, default: false }, // BR17: explicit user consent required
    selectedFields: { type: [String], default: [] }, // BR22: user-chosen fields to share
  },
  { timestamps: true }
);

exportSchema.index({ status: 1 }); // admin/active listings feed
exportSchema.index({ userId: 1, status: 1 }); // user's export history filtered by status

module.exports = mongoose.model('Export', exportSchema);
