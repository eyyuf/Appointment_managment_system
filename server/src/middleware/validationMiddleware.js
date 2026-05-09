const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/responseHandler');

const formatValidationErrors = (errors) => {
  return errors.map((err) => ({
    field: err.path || err.param || 'unknown',
    message: err.msg,
    location: err.location,
  }));
};

/**
 * Runs after express-validator chains and returns a standardized 400 response.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return badRequest(res, 'Validation failed', formatValidationErrors(result.array()));
};

module.exports = { validate };
