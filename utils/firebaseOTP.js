// const { auth } = require('../config/firebase');
// const { User } = require('../models');
// const moment = require('moment');

// class FirebaseOTP {
//   // Generate OTP
//   static async generateOTP(phone) {
//     try {
//       // Format phone number
//       const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
//       // Generate 6-digit OTP
//       const otp = Math.floor(100000 + Math.random() * 900000).toString();
//       const otpExpiry = moment().add(10, 'minutes').toDate();
      
//       // Save OTP to user record
//       const user = await User.findOne({ where: { phone } });
//       if (user) {
//         user.otp = otp;
//         user.otp_expiry = otpExpiry;
//         await user.save();
//       }
      
//       // In production, send OTP via SMS using Firebase
//       // For development, return OTP directly
//       if (process.env.NODE_ENV === 'production') {
//         // Uncomment for production
//         // await auth.createUser({ phoneNumber: formattedPhone });
//         // OTP will be sent automatically by Firebase
//         console.log(`OTP sent to ${formattedPhone}`);
//       }
      
//       return { 
//         success: true, 
//         otp: process.env.NODE_ENV === 'development' ? otp : null,
//         message: process.env.NODE_ENV === 'development' 
//           ? `OTP for development: ${otp}` 
//           : 'OTP sent successfully'
//       };
//     } catch (error) {
//       console.error('OTP generation error:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   // Verify OTP
//   static async verifyOTP(phone, otp) {
//     try {
//       const user = await User.findOne({ where: { phone } });
      
//       if (!user) {
//         return { success: false, message: 'User not found' };
//       }
      
//       // Check if OTP exists and is not expired
//       if (!user.otp || !user.otp_expiry) {
//         return { success: false, message: 'OTP not generated' };
//       }
      
//       if (moment().isAfter(user.otp_expiry)) {
//         return { success: false, message: 'OTP expired' };
//       }
      
//       if (user.otp !== otp) {
//         return { success: false, message: 'Invalid OTP' };
//       }
      
//       // Clear OTP after successful verification
//       user.otp = null;
//       user.otp_expiry = null;
//       user.is_verified = true;
//       await user.save();
      
//       return { success: true, message: 'OTP verified successfully' };
//     } catch (error) {
//       console.error('OTP verification error:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   // Verify Firebase token (for production)
//   static async verifyFirebaseToken(idToken) {
//     try {
//       const decodedToken = await auth.verifyIdToken(idToken);
//       return { success: true, user: decodedToken };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }
// }

// module.exports = FirebaseOTP;






const { User } = require('../models');
const moment = require('moment');

class SimulatedOTP {
  // Generate and store OTP
  static async generateOTP(phone) {
    try {
      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        return {
          success: false,
          message: 'Phone number must be 10 digits'
        };
      }
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = moment().add(10, 'minutes').toDate();
      
      // Save OTP to database
      const user = await User.findOne({ where: { phone: cleanPhone } });
      
      if (user) {
        user.otp = otp;
        user.otp_expiry = otpExpiry;
        await user.save();
      } else {
        // Create temporary user record if doesn't exist
        await User.create({
          phone: cleanPhone,
          otp: otp,
          otp_expiry: otpExpiry,
          is_verified: false,
          is_active: true,
          full_name: 'Pending Registration',
          email: `temp-${Date.now()}@example.com`,
          password_hash: 'temp-password-' + Date.now()
        });
      }
      
      // Log OTP to console (for development)
      console.log('='.repeat(50));
      console.log(`📱 OTP for ${cleanPhone}: ${otp}`);
      console.log(`⏱️  Expires at: ${otpExpiry.toLocaleTimeString()}`);
      console.log('='.repeat(50));
      
      return {
        success: true,
        message: 'OTP generated successfully',
        otp: otp, // Return OTP for development
        phone: cleanPhone,
        expires_at: otpExpiry
      };
    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error.message
      };
    }
  }

  // Verify OTP from database
  static async verifyOTP(phone, otp) {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      const user = await User.findOne({ where: { phone: cleanPhone } });
      
      if (!user) {
        return {
          success: false,
          message: 'User not found. Please register first.'
        };
      }
      
      // Check if OTP exists
      if (!user.otp || !user.otp_expiry) {
        return {
          success: false,
          message: 'No OTP generated. Please request a new OTP.'
        };
      }
      
      // Check if OTP is expired
      if (moment().isAfter(user.otp_expiry)) {
        // Clear expired OTP
        user.otp = null;
        user.otp_expiry = null;
        await user.save();
        
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }
      
      // Verify OTP
      if (user.otp !== otp) {
        // Track failed attempts
        const failedAttempts = user.failed_otp_attempts || 0;
        user.failed_otp_attempts = failedAttempts + 1;
        await user.save();
        
        if (failedAttempts >= 3) {
          return {
            success: false,
            message: 'Too many failed attempts. OTP has been reset.'
          };
        }
        
        return {
          success: false,
          message: 'Invalid OTP'
        };
      }
      
      // Clear OTP after successful verification
      user.otp = null;
      user.otp_expiry = null;
      user.failed_otp_attempts = 0;
      user.is_verified = true;
      user.last_otp_verified = new Date();
      await user.save();
      
      console.log(`✅ OTP verified successfully for ${cleanPhone}`);
      
      return {
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          is_verified: true
        }
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error.message
      };
    }
  }

  // Resend OTP
  static async resendOTP(phone) {
    return this.generateOTP(phone);
  }

  // Validate OTP format
  static isValidOTP(otp) {
    return /^\d{6}$/.test(otp);
  }

  // Generate OTP for testing
  static generateTestOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Check if OTP is expired
  static isOTPExpired(expiryTime) {
    return moment().isAfter(expiryTime);
  }
}

module.exports = SimulatedOTP;