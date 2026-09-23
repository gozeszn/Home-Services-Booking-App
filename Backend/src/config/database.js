const mongoose = require("mongoose");
const env = require("./env");
const User = require("../models/User");

async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  // Ensure the unique email index is ready before accepting requests.
  await User.init();

  console.log("MongoDB connected");
}

module.exports = connectDatabase;