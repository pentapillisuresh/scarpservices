const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadProfileImage } = require('../middlewares/upload');

// All routes require authentication
// router.use(protect);

router.get('/', protect,authorize('user'), UserController.getProfile);

// router.put('/',authorize('user'), UserController.updateProfile);
router.put(
    '/', protect,
    authorize('user'),
    uploadProfileImage,      // 🔴 THIS LINE WAS MISSING
    UserController.updateProfile
  );

router.put('/:phone', UserController.inactiveProfile);

module.exports = router;