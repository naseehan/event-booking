const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const { isDbConnected } = require('../config/db');

const authenticate = (req, res, next) => {
  // Check if DB is alive to prevent query hanging
  if (!isDbConnected()) {
    return next(ApiError.serviceUnavailable('Database connection is currently unavailable. Please retry.'));
  }

  let token = null;

  // 1. Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Cookie fallback
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 3. Fallback token header
  if (!token && req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      req.userId = decoded.id;
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Session expired. Please log in again.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }
  }

  // Backward compatibility fallback for legacy client sending userid header
  const legacyUserId = req.headers['userid'] || req.body?.createdBy;
  if (legacyUserId) {
    req.user = { id: legacyUserId };
    req.userId = legacyUserId;
    return next();
  }

  return next(ApiError.unauthorized('Authentication required to access this resource.'));
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      req.userId = decoded.id;
    } catch (err) {
      // Ignored for optional auth
    }
  }
  next();
};

module.exports = { authenticate, optionalAuth };
