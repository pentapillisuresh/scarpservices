const { UserAddress } = require('../models');
const { Op } = require('sequelize');

class UserAddressController {
  // Create new address
  static async createAddress(req, res) {
    try {
      const userId = req.user.id;
      const {
        address_line1,
        address_line2,
        landmark,
        city,
        state,
        country,
        pincode,
        latitude,
        longitude,
        is_default
      } = req.body;
      
      // If setting as default, unset other defaults
      if (is_default) {
        await UserAddress.update(
          { is_default: false },
          { where: { user_id: userId, is_default: true } }
        );
      }
      
      const address = await UserAddress.create({
        user_id: userId,
        address_line1,
        address_line2,
        landmark,
        city,
        state,
        country: country || 'India',
        pincode,
        latitude,
        longitude,
        is_default: is_default || false
      });
      
      res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: address
      });
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get all user addresses
  static async getUserAddresses(req, res) {
    try {
      const userId = req.user.id;
      
      const addresses = await UserAddress.findAll({
        where: { user_id: userId },
        order: [
          ['is_default', 'DESC'],
          ['created_at', 'DESC']
        ]
      });
      
      res.json({
        success: true,
        data: addresses
      });
    } catch (error) {
      console.error('Get user addresses error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get single address
  static async getAddress(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const address = await UserAddress.findOne({
        where: { id, user_id: userId }
      });
      
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }
      
      res.json({
        success: true,
        data: address
      });
    } catch (error) {
      console.error('Get address error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update address
  static async updateAddress(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const {
        address_line1,
        address_line2,
        landmark,
        city,
        state,
        country,
        pincode,
        latitude,
        longitude,
        is_default
      } = req.body;
      
      const address = await UserAddress.findOne({
        where: { id, user_id: userId }
      });
      
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }
      
      // If setting as default, unset other defaults
      if (is_default) {
        await UserAddress.update(
          { is_default: false },
          { where: { user_id: userId, is_default: true, id: { [Op.ne]: id } } }
        );
      }
      
      // Update address
      await address.update({
        address_line1: address_line1 || address.address_line1,
        address_line2: address_line2 !== undefined ? address_line2 : address.address_line2,
        landmark: landmark !== undefined ? landmark : address.landmark,
        city: city || address.city,
        state: state || address.state,
        country: country || address.country,
        pincode: pincode || address.pincode,
        latitude: latitude !== undefined ? latitude : address.latitude,
        longitude: longitude !== undefined ? longitude : address.longitude,
        is_default: is_default !== undefined ? is_default : address.is_default
      });
      
      res.json({
        success: true,
        message: 'Address updated successfully',
        data: address
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete address
  static async deleteAddress(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const address = await UserAddress.findOne({
        where: { id, user_id: userId }
      });
      
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }
      
      // Check if it's the default address
      if (address.is_default) {
        // Find another address to make default
        const anotherAddress = await UserAddress.findOne({
          where: { user_id: userId, id: { [Op.ne]: id } }
        });
        
        if (anotherAddress) {
          await anotherAddress.update({ is_default: true });
        }
      }
      
      await address.destroy();
      
      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Set default address
  static async setDefaultAddress(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const address = await UserAddress.findOne({
        where: { id, user_id: userId }
      });
      
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }
      
      // Unset other defaults
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: userId, is_default: true, id: { [Op.ne]: id } } }
      );
      
      // Set this as default
      address.is_default = true;
      await address.save();
      
      res.json({
        success: true,
        message: 'Address set as default successfully'
      });
    } catch (error) {
      console.error('Set default address error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = UserAddressController;