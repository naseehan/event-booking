const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const cartRoutes = require('./cart.routes');
const paymentRoutes = require('./payment.routes');
const { isDbConnected } = require('../config/db');

// Health check endpoint
router.get('/health', (req, res) => {
  const dbStatus = isDbConnected();
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected',
  });
});

router.use('/', authRoutes);
router.use('/', eventRoutes);
router.use('/', cartRoutes);
router.use('/', paymentRoutes);

module.exports = router;
