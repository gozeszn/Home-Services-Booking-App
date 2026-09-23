const authService = require("../services/authService");

async function register(req, res) {
  const result = await authService.registerUser(req.validated.body);

  return res.status(201).json({
    success: true,
    data: result,
  });
}

async function login(req, res) {
  const result = await authService.loginUser(req.validated.body);

  return res.status(200).json({
    success: true,
    data: result,
  });
}

module.exports = {
  register,
  login,
};