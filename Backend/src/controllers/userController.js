const toUserResponse = require("../utils/toUserResponse");
const userService = require("../services/userService");

function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: toUserResponse(req.user),
    },
  });
}

async function updateMe(req, res) {
  const user = await userService.updateProfile(
    req.user._id,
    req.validated.body
  );

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
}

module.exports = {
  getMe,
  updateMe,
};