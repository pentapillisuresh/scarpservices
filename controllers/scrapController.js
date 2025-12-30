const {
    Category,
    UserAddress,
    CollectionRequest,
    RequestItem,
    RequestImage
  } = require('../models');
  const { processImage } = require('../middlewares/upload');
  const { Op } = require('sequelize');
  
  class ScrapController {
    // Get all categories
    static async getCategories(req, res) {
      try {
        const categories = await Category.findAll({
          where: { is_active: true },
          attributes: ['id', 'name', 'description', 'icon']
        });
        
        res.json({
          success: true,
          data: categories
        });
      } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Create scrap collection request
    static async createRequest(req, res) {
      try {
        const userId = req.user.id;
        const { 
          address_id, 
          items, 
          pickup_date, 
          pickup_time_slot, 
          notes 
        } = req.body;
        
        // Validate address belongs to user
        const address = await UserAddress.findOne({
          where: { id: address_id, user_id: userId }
        });
        
        if (!address) {
          return res.status(400).json({
            success: false,
            message: 'Invalid address'
          });
        }
        
        // Parse items if it's a string
        const scrapItems = typeof items === 'string' ? JSON.parse(items) : items;
        
        // Validate items
        if (!Array.isArray(scrapItems) || scrapItems.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one scrap item is required'
          });
        }
        
        // Calculate totals
        let totalWeight = 0;
        let totalValue = 0;
        
        // Validate categories
        for (const item of scrapItems) {
          const category = await Category.findByPk(item.category_id);
          if (!category) {
            return res.status(400).json({
              success: false,
              message: `Invalid category id: ${item.category_id}`
            });
          }
          
          totalWeight += parseFloat(item.weight || 0);
          totalValue += parseFloat(item.estimated_value || 0);
        }
        
        // Create collection request
        const request = await CollectionRequest.create({
          user_id: userId,
          address_id,
          total_weight: totalWeight,
          total_estimated_value: totalValue,
          pickup_date,
          pickup_time_slot,
          notes,
          status: 'pending'
        });
        
        // Create request items
        const requestItems = [];
        for (const item of scrapItems) {
          const requestItem = await RequestItem.create({
            request_id: request.id,
            category_id: item.category_id,
            quantity: item.quantity || 1,
            weight: item.weight,
            estimated_value: item.estimated_value,
            description: item.description
          });
          
          requestItems.push(requestItem);
        }
        
        // Handle image uploads
        if (req.files && req.files.length > 0) {
          for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const itemIndex = req.body.image_item_index ? req.body.image_item_index[i] : 0;
            
            if (itemIndex >= 0 && itemIndex < requestItems.length) {
              const processedImage = await processImage(file);
              
              await RequestImage.create({
                request_item_id: requestItems[itemIndex].id,
                image_url: processedImage.url,
                image_type: 'scrap',
                is_primary: i === 0 // First image is primary
              });
            }
          }
        }
        
        // Get full request details
        const fullRequest = await CollectionRequest.findByPk(request.id, {
          include: [
            {
              model: RequestItem,
              include: [
                { model: Category },
                { model: RequestImage }
              ]
            },
            { model: UserAddress }
          ]
        });
        
        res.status(201).json({
          success: true,
          message: 'Scrap collection request created successfully',
          data: fullRequest
        });
      } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Get user's scrap requests
    static async getUserRequests(req, res) {
      try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;
        
        const where = { user_id: userId };
        if (status) where.status = status;
        
        const offset = (page - 1) * limit;
        
        const requests = await CollectionRequest.findAndCountAll({
          where,
          include: [
            {
              model: RequestItem,
              include: [
                { model: Category },
                { model: RequestImage }
              ]
            },
            { model: UserAddress }
          ],
          order: [['created_at', 'DESC']],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        
        res.json({
          success: true,
          data: {
            requests: requests.rows,
            pagination: {
              total: requests.count,
              page: parseInt(page),
              totalPages: Math.ceil(requests.count / limit)
            }
          }
        });
      } catch (error) {
        console.error('Get user requests error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Get single request details
    static async getRequestDetails(req, res) {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const request = await CollectionRequest.findOne({
          where: { id, user_id: userId },
          include: [
            {
              model: RequestItem,
              include: [
                { model: Category },
                { model: RequestImage }
              ]
            },
            { model: UserAddress }
          ]
        });
        
        if (!request) {
          return res.status(404).json({
            success: false,
            message: 'Request not found'
          });
        }
        
        res.json({
          success: true,
          data: request
        });
      } catch (error) {
        console.error('Get request details error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Cancel request
    static async cancelRequest(req, res) {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const request = await CollectionRequest.findOne({
          where: { id, user_id: userId }
        });
        
        if (!request) {
          return res.status(404).json({
            success: false,
            message: 'Request not found'
          });
        }
        
        // Only allow cancellation if request is pending
        if (request.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: 'Request cannot be cancelled in current status'
          });
        }
        
        request.status = 'cancelled';
        await request.save();
        
        res.json({
          success: true,
          message: 'Request cancelled successfully'
        });
      } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  }
  
  module.exports = ScrapController;