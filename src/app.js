const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/error.middleware');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security & Parsing Middlewares
app.use(cookieParser());

// Dynamic CORS configuration allowing localhost, Render, Vercel, and configured clientUrl
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, server-side, curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.clientUrl,
      'https://noble-events.onrender.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Pattern matching for Render and Vercel preview/production deployments
    if (/\.onrender\.com$/.test(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // Default fallback in development/production
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'userid', 'x-auth-token'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api', generalLimiter);

// Mount API routes at both /api and root / for full backwards compatibility
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Serve static frontend build if present
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'build');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  // If request starts with /api, return 404 rather than index.html
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
