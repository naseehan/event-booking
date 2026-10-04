const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 3001,
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/event-booking',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  stripeSecret: process.env.STRIPE_SECRET || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = config;
