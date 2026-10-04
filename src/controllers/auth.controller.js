const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

const signup = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.badRequest('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  const token = generateToken(user);
  setTokenCookie(res, token);

  return ApiResponse.created(res, {
    user: { id: user._id, email: user.email },
    token,
  }, 'Account created successfully');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw ApiError.badRequest('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw ApiError.badRequest('Invalid email or password');
  }

  const token = generateToken(user);
  setTokenCookie(res, token);

  // Return both standardized structure and legacy structure for seamless client compatibility
  const result = {
    existingUser: { _id: user._id, email: user.email },
    user: { id: user._id, email: user.email },
    token,
    email: user.email,
  };

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    result,
    token,
    user: result.user,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return ApiResponse.success(res, { user: { id: user._id, email: user.email } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return ApiResponse.success(res, null, 'Logged out successfully');
});

module.exports = { signup, login, getProfile, logout };
