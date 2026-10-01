const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 20, maxlength: 1500 },
  phone: { type: String, required: true, trim: true, minlength: 7, maxlength: 30 },
  serviceArea: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  availabilitySummary: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
}, { timestamps: true });

module.exports = mongoose.model("ServiceProvider", providerSchema);
