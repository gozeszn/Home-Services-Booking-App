const AppError = require("../utils/AppError");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong. Please try again.";
  let details = [];

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error.type === "entity.parse.failed") {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Request body contains invalid JSON.";
  } else if (error.type === "entity.too.large") {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body exceeds the allowed size.";
  } else if (error.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    message = "A record with these unique details already exists.";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "The supplied data is invalid.";
  } else if (error.name === "CastError") {
    statusCode = 400;
    code = "INVALID_VALUE";
    message = "An identifier or field value is invalid.";
  }

  if (statusCode >= 500) {
    // Avoid logging request bodies, tokens, or database credentials.
    console.error("Request failed:", {
      method: req.method,
      errorName: error.name,
      code,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = errorHandler;