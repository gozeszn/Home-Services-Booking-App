const mongoose = require("mongoose");
const User = require("./User");

const providerSchema = new mongoose.Schema(
  {
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
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