const User = require("../models/User");
const AppError = require("../utils/AppError");
const toUserResponse = require("../utils/toUserResponse");

async function updateProfile(userId, profileData) {
  const updates = {};

  // Explicitly allow only these fields.
  for (const field of ["fullName", "phone", "location"]) {
    if (profileData[field] !== undefined) {
      updates[field] = profileData[field];
    }
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      status: "active",
    },
    {
      $set: updates,
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!user) {
    throw new AppError(
      "Your account is no longer available for updates",
      403,
      "ACCOUNT_UNAVAILABLE"
    );
  }

  return toUserResponse(user);
}

module.exports = {
  updateProfile,
};