const AppError = require("../utils/AppError");

function notFound(req, res, next) {
  next(new AppError("Route not found", 404, "NOT_FOUND"));
}

module.exports = notFound;