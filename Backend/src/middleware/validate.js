const AppError = require("../utils/AppError");

function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const details = [];

    for (const source of ["params", "query", "body"]) {
      const schema = schemas[source];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            field: [source, ...issue.path].join("."),
            message: issue.message,
          });
        }
      } else {
        validated[source] = result.data;
      }
    }

    if (details.length > 0) {
      return next(
        new AppError(
          "Request validation failed",
          400,
          "VALIDATION_ERROR",
          details
        )
      );
    }

    req.validated = validated;

    return next();
  };
}

module.exports = validate;