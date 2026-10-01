const mongoose = require("mongoose");
const env = require("./env");
const User = require("../models/User");
const ServiceProvider = require("../models/serviceProvider");

async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  // Enforce unique accounts and one profile per user before accepting requests.
  await Promise.all([User.init(), ServiceProvider.init()]);

  console.log("MongoDB connected");
}

module.exports = connectDatabase;
