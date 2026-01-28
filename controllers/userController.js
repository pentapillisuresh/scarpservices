const { User, CollectionRequest, RequestItem, Category, RequestImage, UserAddress } = require('../models');
const { processUploadedFile } = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');
const { where } = require('../config/database');

class UserController {
  // Update profile with image
  static async updateProfile(req, res) {
    try {
      const { full_name } = req.body;
      const user = await User.findByPk(req.user.id);
      
      let profileImageUrl = user.profile_image;
      
      // Process profile image if uploaded
      if (req.file) {
        try {
          // Delete old profile image if exists
          if (user.profile_image) {
            const oldImagePath = path.join(__dirname, '..', user.profile_image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
          
          const processedImage = await processUploadedFile(req.file, 'profile');
          profileImageUrl = processedImage.url;
        } catch (error) {
          console.error('Profile image processing error:', error);
          return res.status(500).json({
            success: false,
            message: 'Error processing profile image'
          });
        }
      }
      
      // Update user
      if (full_name) user.full_name = full_name;
      if (profileImageUrl) user.profile_image = profileImageUrl;
      
      await user.save();
      
      // Generate full URL for profile image
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const userResponse = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        is_verified: user.is_verified,
        profile_image: user.profile_image ? 
          (user.profile_image.startsWith('http') ? 
            user.profile_image : 
            `${baseUrl}${user.profile_image}`) : 
          null
      };
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: userResponse
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  static async inactiveProfile(req, res) {
    try {
      const { phone } = req.params;
  
      const [updatedCount] = await User.update(
        { is_active: false, is_verified: false },
        { where: { phone } }
      );
  
      if (updatedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
  
      res.json({
        success: true,
        message: 'User Profile Deactivated successfully',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
  
  // Get user profile with full image URLs
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash', 'otp', 'otp_expiry', 'verification_token'] }
      });
      
      // Generate full URL for profile image
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const userData = user.toJSON();
      
      if (userData.profile_image && !userData.profile_image.startsWith('http')) {
        userData.profile_image = `${baseUrl}${userData.profile_image}`;
      }
      
      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const userData = await User.findAll({
        attributes: {
          exclude: ['password_hash', 'otp', 'otp_expiry', 'verification_token']
        },
        include: [
          {
            model: CollectionRequest,
            required: true // INNER JOIN (only users with collection requests)
          }
        ]
      });
  
      res.status(200).json({
        success: true,
        data: userData
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
  }

module.exports = UserController;