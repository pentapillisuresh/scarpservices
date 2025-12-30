const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./authRoutes');
const scrapRoutes = require('./scrapRoutes');
const adminRoutes = require('./adminRoutes');
const userAddressRoutes = require('./userAddressRoutes');
const categoryRoutes = require('./categoryRoutes');
const notificationRoutes = require('./notificationRoutes');

// Use routes with proper prefixes
router.use('/auth', authRoutes);
router.use('/scrap', scrapRoutes);
router.use('/admin', adminRoutes);
router.use('/user/addresses', userAddressRoutes); // Changed from /user to /user/addresses
router.use('/categories', categoryRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;