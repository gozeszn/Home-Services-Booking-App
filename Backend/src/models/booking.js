const mongoose = require("mongoose");

const STATUS_VALUES = [
  "pending",
  "accepted",
  "rejected",
  "in_progress",
  "completed",
  "cancelled",
];

const PAYMENT_STATUS_VALUES = [
  "unpaid",
  "paid",
  "refunded",
];

const bookingHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: STATUS_VALUES,
      default: null,
    },
    to: {
      type: String,
      enum: STATUS_VALUES,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // This references the provider profile, matching Service.provider.
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
      index: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },

    // These snapshots must never change after the booking is created.
    serviceTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    providerDisplayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    agreedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["NGN"],
      required: true,
      default: "NGN",
    },
    pricingUnit: {
      type: String,
      enum: ["visit", "hour", "job", "day"],
      required: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    serviceAddress: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 300,
    },
    customerNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: STATUS_VALUES,
      required: true,
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      required: true,
      default: "unpaid",
    },

    statusHistory: {
      type: [bookingHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({
  customer: 1,
  scheduledAt: -1,
});

bookingSchema.index({
  provider: 1,
  scheduledAt: 1,
});

bookingSchema.index({
  provider: 1,
  status: 1,
  scheduledAt: 1,
});

module.exports = mongoose.model("Booking", bookingSchema);

module.exports.STATUS_VALUES = STATUS_VALUES;
module.exports.PAYMENT_STATUS_VALUES = PAYMENT_STATUS_VALUES;