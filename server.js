const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const scrapRoutes = require('./routes/scrapRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userAddressRoutes = require('./routes/userAddressRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

const { syncDatabase } = require('./models');
const sequelize = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;
// Global unhandled error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.set('trust proxy', true,1);
// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API base path
const BASE = '/api/v1';

app.use(`${BASE}/auth`, authRoutes);
app.use(`${BASE}/scrap`, scrapRoutes);
app.use(`${BASE}/user`, userRoutes);
app.use(`${BASE}/admin`, adminRoutes);
app.use(`${BASE}/userAddresses`, userAddressRoutes);
app.use(`${BASE}/categories`, categoryRoutes);
app.use(`${BASE}/notifications`, notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Scrap Collection API',
    version: '1.0.0'
  });
});

// 404 handler
app.use( (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ success: false, message: err.errors.map(e => e.message).join(', ') });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start server
const startServer = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    }
    console.log('✅ Database synchronized successfully');

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}${BASE}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🖼️  Image storage: Local uploads folder`);
      console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Exit if server fails to start
  }
};

startServer();
