const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[MongoDB] Connection lost. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('[MongoDB] Connection re-established.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Initial connection failed: ${error.message}`);
    // In production we may not want process.exit so server can serve health checks / retry
  }
};

const isDbConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbConnected };
