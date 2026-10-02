const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
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

    // Snapshot from the booking. Never accept an amount from the client.
    amount: {
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

    status: {
      type: String,
      enum: ["paid", "refunded"],
      required: true,
      default: "paid",
    },

    // MVP simulation only; never collect cards or other sensitive payment data.
    method: {
      type: String,
      enum: ["test"],
      required: true,
      default: "test",
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  customer: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Payment", paymentSchema);