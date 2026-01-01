const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name')
    .notEmpty().withMessage('Full name is required')
    .trim()
];

const validateLogin = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const validatePhoneLogin = [
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits')
];

const validateOTP = [
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .matches(/^[0-9]{6}$/).withMessage('OTP must be 6 digits')
];

// Public routes
router.post('/register', AuthController.registerOrLogin);
router.post('/verify-registration', validateOTP, AuthController.verifyRegistrationOTP);
router.post('/login', validateLogin, AuthController.login);
router.post('/login/phone', validatePhoneLogin, AuthController.loginWithPhone);
router.post('/login/phone/verify', validateOTP, AuthController.verifyPhoneLogin);
router.post('/resend-otp', validatePhoneLogin, AuthController.resendOTP);
router.post('/forgot-password', 
  body('email').isEmail().withMessage('Valid email is required'),
  AuthController.forgotPassword
);
router.post('/reset-password', 
  [
    body('phone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
    body('otp')
      .notEmpty().withMessage('OTP is required')
      .matches(/^[0-9]{6}$/).withMessage('OTP must be 6 digits'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  AuthController.resetPassword
);

// Development/testing routes
router.post('/quick-login', 
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  AuthController.quickLogin
);

// Test OTP generation
router.post('/test-otp', 
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  async (req, res) => {
    try {
      const SimulatedOTP = require('../utils/firebaseOTP');
      const result = await SimulatedOTP.generateOTP(req.body.phone);
      
      res.json({
        success: true,
        message: 'Test OTP generated',
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;