const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard/stats', AdminController.getDashboardStats);

// Requests management
// router.get('/requests/pending', AdminController.getPendingRequests);
router.get('/requests', AdminController.getAllRequests);
router.put('/requests/:id/accept', AdminController.acceptRequest);
router.put('/requests/:id/reject', AdminController.rejectRequest);

module.exports = router;