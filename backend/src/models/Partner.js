const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, trim: true }, // e.g. 'Tailor', 'Resale', 'Donation'
    website: { type: String },
    email: { type: String, trim: true, lowercase: true },
    description: { type: String },
    apiEndpoint: { type: String }, // programmatic integration URL
    isActive: { type: Boolean, default: true }, // BR30: inactive partners hidden from export options
  },
  { timestamps: true }
);

partnerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Partner', partnerSchema);
