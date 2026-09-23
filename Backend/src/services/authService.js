const bcrypt = require("bcrypt");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const createAccessToken = require("../utils/createAccessToken");
const toUserResponse = require("../utils/toUserResponse");

async function registerUser({ fullName, email, password, role }) {
  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists",
      409,
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;

  try {
    user = await User.create({
      fullName,
      email,
      passwordHash,
      role,
    });
  } catch (error) {
    // The unique index also protects against simultaneous registrations.
    if (error.code === 11000 && error.keyPattern?.email) {
      throw new AppError(
        "An account with this email already exists",
        409,
        "EMAIL_ALREADY_EXISTS"
      );
    }

    throw error;
  }

  return {
    user: toUserResponse(user),
    accessToken: createAccessToken(user),
  };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  if (user.status !== "active") {
    throw new AppError(
      "Your account is inactive",
      403,
      "ACCOUNT_INACTIVE"
    );
  }

  return {
    user: toUserResponse(user),
    accessToken: createAccessToken(user),
  };
}

module.exports = {
  registerUser,
  loginUser,
};