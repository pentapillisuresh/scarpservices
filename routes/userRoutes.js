const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

router.get('/',authorize('user'), UserController.getProfile);

router.put('/',authorize('user'), UserController.updateProfile);

module.exports = router;