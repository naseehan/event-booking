const app = require('./src/app');
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');

// Initiate resilient database connection
connectDB();

const server = app.listen(config.port, () => {
  console.log(`[Server] Noble Events backend running on port ${config.port}`);
  console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

module.exports = server;
