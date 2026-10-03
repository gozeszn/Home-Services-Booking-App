const mongoose = require("mongoose");

const moderationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["published", "hidden"],
      required: true,
      default: "published",
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const reviewSchema = new mongoose.Schema(
  {
    // A unique booking reference guarantees one review per booking.
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

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

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number.",
      },
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    moderation: {
      type: moderationSchema,
      required: true,
      default: () => ({
        status: "published",
        reason: "",
        moderatedBy: null,
        moderatedAt: null,
      }),
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ service: 1, createdAt: -1 });
reviewSchema.index({ provider: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ "moderation.status": 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);