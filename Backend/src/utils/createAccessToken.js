const jwt = require("jsonwebtoken");
const env = require("../config/env");

function createAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
    },
    env.JWT_SECRET,
    {
      subject: user._id.toString(),
      algorithm: "HS256",
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
}

module.exports = createAccessToken;