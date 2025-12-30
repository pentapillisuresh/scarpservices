const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Notification management
router.get('/', NotificationController.getUserNotifications);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);
router.delete('/:id', NotificationController.deleteNotification);
router.delete('/', NotificationController.clearAllNotifications);

module.exports = router;