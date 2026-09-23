const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
  const authorization = req.get("Authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    throw new AppError(
      "A Bearer token is required",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  let payload;

  try {
    payload = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError(
        "Your session has expired. Please log in again.",
        401,
        "TOKEN_EXPIRED"
      );
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      throw new AppError(
        "Invalid authentication token",
        401,
        "INVALID_TOKEN"
      );
    }

    throw error;
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !mongoose.isObjectIdOrHexString(payload.sub) ||
    !Number.isInteger(payload.exp)
  ) {
    throw new AppError(
      "Invalid authentication token",
      401,
      "INVALID_TOKEN"
    );
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new AppError(
      "This session is no longer valid. Please log in again.",
      401,
      "INVALID_SESSION"
    );
  }

  if (user.status !== "active") {
    throw new AppError(
      "Your account is inactive",
      403,
      "ACCOUNT_INACTIVE"
    );
  }

  req.user = user;

  return next();
}

module.exports = authenticate;