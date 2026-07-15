const mongoose = require('mongoose');
const { PARTNER_TYPES } = require('../config/constants');

const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: PARTNER_TYPES, trim: true },
    website: { type: String },
    email: { type: String, trim: true, lowercase: true },
    description: { type: String },
    location: { type: String, trim: true }, // local shops (tailor/upcycle directory)
    apiEndpoint: { type: String }, // programmatic integration URL
    isActive: { type: Boolean, default: true }, // BR30: inactive partners hidden from export options
  },
  { timestamps: true }
);

partnerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Partner', partnerSchema);
