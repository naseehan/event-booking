const ApiError = require('../utils/apiError');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(config.isProduction ? {} : { stack: error.stack }),
  };

  if (error.statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, error);
  }

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
