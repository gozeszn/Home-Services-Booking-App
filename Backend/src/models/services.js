const mongoose = require("mongoose");
const { PRICING_UNITS, LEGACY_UNITS, normalizePricingUnit, isValidPrice } = require("../utils/catalogRules");

const serviceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  price: { type: Number, required: true, validate: { validator: isValidPrice, message: "Invalid NGN price" } },
  currency: { type: String, enum: ["NGN"], default: "NGN" },
  description: { type: String, required: true, trim: true, minlength: 20, maxlength: 1500 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  // Legacy values remain readable/editable without a destructive migration.
  pricingUnit: {
    type: String, required: true,
    enum: [...PRICING_UNITS, ...Object.keys(LEGACY_UNITS)],
    set: normalizePricingUnit,
  },
  serviceArea: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  availabilitySummary: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" },
}, { timestamps: true });

serviceSchema.index({ provider: 1, status: 1, createdAt: -1 });
serviceSchema.index({ status: 1, categoryId: 1 });

module.exports = mongoose.model("Service", serviceSchema);
