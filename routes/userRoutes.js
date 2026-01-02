const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadProfileImage } = require('../middlewares/upload');

// All routes require authentication
router.use(protect);

router.get('/',authorize('user'), UserController.getProfile);

// router.put('/',authorize('user'), UserController.updateProfile);
router.put(
    '/',
    authorize('user'),
    uploadProfileImage,      // 🔴 THIS LINE WAS MISSING
    UserController.updateProfile
  );module.exports = router;