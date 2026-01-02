// const { User } = require('../models');
// const { generateToken } = require('../utils/generateToken');
// const FirebaseOTP = require('../utils/firebaseOTP');
// const { validationResult } = require('express-validator');

// class AuthController {
//   // User registration
//   static async register(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ success: false, errors: errors.array() });
//       }

//       const { email, phone, password, full_name } = req.body;

//       // Check if user already exists
//       const existingUser = await User.findOne({ 
//         where: { 
//           [Op.or]: [{ email }, { phone }]
//         }
//       });

//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           message: 'User with this email or phone already exists'
//         });
//       }

//       // Create user
//       const user = await User.create({
//         email,
//         phone,
//         password_hash: password,
//         full_name,
//         is_verified: false
//       });

//       // Generate OTP
//       const otpResult = await FirebaseOTP.generateOTP(phone);

//       if (!otpResult.success) {
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to generate OTP'
//         });
//       }

//       res.status(201).json({
//         success: true,
//         message: 'Registration successful. Please verify OTP.',
//         otp: process.env.NODE_ENV === 'development' ? otpResult.otp : undefined,
//         data: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           full_name: user.full_name
//         }
//       });
//     } catch (error) {
//       console.error('Registration error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error during registration'
//       });
//     }
//   }

//   // Verify OTP
//   static async verifyOTP(req, res) {
//     try {
//       const { phone, otp } = req.body;

//       if (!phone || !otp) {
//         return res.status(400).json({
//           success: false,
//           message: 'Phone and OTP are required'
//         });
//       }

//       const result = await FirebaseOTP.verifyOTP(phone, otp);

//       if (!result.success) {
//         return res.status(400).json(result);
//       }

//       // Get user and generate token
//       const user = await User.findOne({ where: { phone } });

//       const token = generateToken(user.id, user.role);

//       res.json({
//         success: true,
//         message: 'OTP verified successfully',
//         token,
//         user: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           full_name: user.full_name,
//           role: user.role,
//           is_verified: user.is_verified
//         }
//       });
//     } catch (error) {
//       console.error('OTP verification error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error during OTP verification'
//       });
//     }
//   }

//   // Resend OTP
//   static async resendOTP(req, res) {
//     try {
//       const { phone } = req.body;

//       if (!phone) {
//         return res.status(400).json({
//           success: false,
//           message: 'Phone number is required'
//         });
//       }

//       const result = await FirebaseOTP.generateOTP(phone);

//       if (!result.success) {
//         return res.status(500).json(result);
//       }

//       res.json({
//         success: true,
//         message: result.message,
//         otp: result.otp
//       });
//     } catch (error) {
//       console.error('Resend OTP error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   }

//   // Login with password
//   static async login(req, res) {
//     try {
//       const { email, password } = req.body;

//       if (!email || !password) {
//         return res.status(400).json({
//           success: false,
//           message: 'Email and password are required'
//         });
//       }

//       // Find user
//       const user = await User.findOne({ where: { email } });

//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: 'Invalid credentials'
//         });
//       }

//       // Check password
//       const isPasswordValid = await user.comparePassword(password);

//       if (!isPasswordValid) {
//         return res.status(401).json({
//           success: false,
//           message: 'Invalid credentials'
//         });
//       }

//       // Check if user is active
//       if (!user.is_active) {
//         return res.status(401).json({
//           success: false,
//           message: 'Account is deactivated'
//         });
//       }

//       // Generate token
//       const token = generateToken(user.id, user.role);

//       res.json({
//         success: true,
//         token,
//         user: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           full_name: user.full_name,
//           role: user.role,
//           is_verified: user.is_verified
//         }
//       });
//     } catch (error) {
//       console.error('Login error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error during login'
//       });
//     }
//   }

//   // Get current user
//   static async getMe(req, res) {
//     try {
//       const user = await User.findByPk(req.user.id, {
//         attributes: { exclude: ['password_hash', 'otp', 'otp_expiry', 'verification_token'] }
//       });

//       res.json({
//         success: true,
//         data: user
//       });
//     } catch (error) {
//       console.error('Get me error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   }

//   // Update profile
//   static async updateProfile(req, res) {
//     try {
//       const { full_name } = req.body;

//       const user = await User.findByPk(req.user.id);

//       if (full_name) user.full_name = full_name;

//       await user.save();

//       res.json({
//         success: true,
//         message: 'Profile updated successfully',
//         data: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           full_name: user.full_name
//         }
//       });
//     } catch (error) {
//       console.error('Update profile error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   }

//   // Change password
//   static async changePassword(req, res) {
//     try {
//       const { currentPassword, newPassword } = req.body;

//       if (!currentPassword || !newPassword) {
//         return res.status(400).json({
//           success: false,
//           message: 'Current and new password are required'
//         });
//       }

//       const user = await User.findByPk(req.user.id);

//       // Verify current password
//       const isPasswordValid = await user.comparePassword(currentPassword);

//       if (!isPasswordValid) {
//         return res.status(401).json({
//           success: false,
//           message: 'Current password is incorrect'
//         });
//       }

//       // Update password
//       user.password_hash = newPassword;
//       await user.save();

//       res.json({
//         success: true,
//         message: 'Password changed successfully'
//       });
//     } catch (error) {
//       console.error('Change password error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error'
//       });
//     }
//   }
// }

// module.exports = AuthController;








const { User } = require('../models');
const { generateToken } = require('../utils/generateToken');
const SimulatedOTP = require('../utils/firebaseOTP'); // Renamed from FirebaseOTP
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

class AuthController {
  // User registration with OTP
  static async registerOrLogin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, phone, password, full_name, role } = req.body;

      const cleanPhone = phone.replace(/\D/g, '');

      // Find user
      let user = await User.findOne({
        where: {
          [Op.or]: [
            { email },
            { phone: cleanPhone }
          ]
        }
      });

      // If user exists → LOGIN
      if (user) {
        // If using bcrypt (recommended)
        // const isMatch = await bcrypt.compare(password, user.password_hash);
        // if (!isMatch) {
        //   return res.status(401).json({ success: false, message: 'Invalid credentials' });
        // }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        const token = generateToken(user.id, user.role);

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            full_name: user.full_name,
            role: user.role
          }
        });
      }

      // If user does NOT exist → REGISTER
      user = await User.create({
        email,
        phone: cleanPhone,
        password_hash: password, // ⚠️ hash this in production
        full_name,
        role: role || 'user',
        is_verified: true,
        is_active: true
      });

      const token = generateToken(user.id, user.role);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Register/Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Verify OTP for registration
  static async verifyRegistrationOTP(req, res) {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone and OTP are required'
        });
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');

      // Verify OTP
      const result = await SimulatedOTP.verifyOTP(cleanPhone, otp);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      // Get user
      const user = await User.findOne({
        where: { phone: cleanPhone }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user as verified
      user.is_verified = true;
      await user.save();

      // Generate token
      const token = generateToken(user.id, user.role);

      res.json({
        success: true,
        message: 'OTP verified successfully. Account activated.',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during OTP verification'
      });
    }
  }

  // Login with email/password
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await User.findOne({
        where: { email }
      });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email credentials'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password credentials'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check if user is verified
      if (!user.is_verified) {
        // Generate OTP for verification
        const otpResult = await SimulatedOTP.generateOTP(user.phone);

        return res.status(200).json({
          success: false,
          message: 'Account not verified. OTP sent to your phone.',
          requires_verification: true,
          phone: user.phone,
          otp: otpResult.otp // Include OTP in development
        });
      }

      // Generate token
      const token = generateToken(user.id, user.role);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified,
          profile_image: user.profile_image
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }

  // Login with phone OTP
  static async loginWithPhone(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
        });
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, "");

      // Find user
      let user = await User.findOne({
        where: { phone: cleanPhone },
      });

      let isNewUser = false;

      // Create user if not exists
      if (!user) {
        user = await User.create({
          phone: cleanPhone,
          is_verified: false,
          is_active: true,
        });
        isNewUser = true;
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Generate OTP
      const otpResult = await SimulatedOTP.generateOTP(cleanPhone);

      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate OTP",
        });
      }

      return res.json({
        success: true,
        message: "OTP sent to your phone",
        phone: cleanPhone,
        isNewUser, // 👈 frontend can decide next step
        otp: otpResult.otp, // ⚠️ dev only
        expires_at: otpResult.expires_at,
      });
    } catch (error) {
      console.error("Phone login error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  // Verify phone OTP login
  static async verifyPhoneLogin(req, res) {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone and OTP are required'
        });
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');

      // Verify OTP
      const result = await SimulatedOTP.verifyOTP(cleanPhone, otp);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      // Get user
      const user = await User.findOne({
        where: { phone: cleanPhone }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate token
      const token = generateToken(user.id, user.role);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified,
          profile_image: user.profile_image
        }
      });
    } catch (error) {
      console.error('Phone login verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Resend OTP
  static async resendOTP(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');

      // Check if user exists
      const user = await User.findOne({ where: { phone: cleanPhone } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate OTP
      const result = await SimulatedOTP.resendOTP(cleanPhone);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json({
        success: true,
        message: 'New OTP sent to your phone',
        phone: cleanPhone,
        otp: result.otp, // Include OTP in development
        expires_at: result.expires_at
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Forgot password - send OTP
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Find user by email
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate OTP for password reset
      const otpResult = await SimulatedOTP.generateOTP(user.phone);

      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate OTP'
        });
      }

      res.json({
        success: true,
        message: 'OTP sent to your registered phone number',
        phone: user.phone,
        otp: otpResult.otp, // Include OTP in development
        expires_at: otpResult.expires_at
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Reset password with OTP
  static async resetPassword(req, res) {
    try {
      const { email, oldPassword, newPassword } = req.body;

      // 1️⃣ Validate input
      if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email, old password, and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // 2️⃣ Find user by email
      const user = await User.findOne({ where: { email } });

      if (!user || !user.password_hash) {
        return res.status(404).json({
          success: false,
          message: 'User not found or password not set'
        });
      }

      // 3️⃣ Compare OLD password (plain text vs hashed password)
      const isOldPasswordCorrect = await user.comparePassword(oldPassword);

      if (!isOldPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: 'Old password is incorrect'
        });
      }

      // 4️⃣ Prevent reusing the same password (recommended)
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from old password'
        });
      }

      // 5️⃣ Update password (auto-hashed by beforeUpdate hook)
      user.password_hash = newPassword;
      await user.save();

      // 6️⃣ Success response
      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Quick login for testing (no OTP required)
  static async quickLogin(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const cleanPhone = phone.replace(/\D/g, '');

      // Find or create user
      let user = await User.findOne({ where: { phone: cleanPhone } });

      if (!user) {
        // Create a test user
        user = await User.create({
          phone: cleanPhone,
          email: `test-${cleanPhone}@example.com`,
          full_name: 'Test User',
          password_hash: await bcrypt.hash('password123', 10),
          is_verified: true,
          is_active: true,
          role: 'user'
        });
      }

      // Generate token
      const token = generateToken(user.id, user.role);

      res.json({
        success: true,
        message: 'Quick login successful (for testing)',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified
        }
      });
    } catch (error) {
      console.error('Quick login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = AuthController;