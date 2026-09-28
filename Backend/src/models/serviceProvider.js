const mongoose = require("mongoose");


const providerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30

    },
    serviceArea: {
      type: String,
      required: true
    },
    availabilitySummary: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

const ServiceProvider = mongoose.model("ServiceProvider", providerSchema);
module.exports = ServiceProvider;