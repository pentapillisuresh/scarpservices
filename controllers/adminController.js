const {
    User,
    CollectionRequest,
    UserAddress,
    RequestItem,
    Category,
    RequestImage,
    Notification
  } = require('../models');
  const { Op, Sequelize } = require('sequelize');
  const moment = require('moment');
  
  class AdminController {
    // Get all pending requests within admin's premises
    static async getPendingRequests(req, res) {
      try {
        const adminId = req.user.id;
        const { page = 1, limit = 10, radius = 10 } = req.query;
               
        
        // Build location filter
        const locationConditions = premises.map(premise => {
          const lat = parseFloat(premise.latitude);
          const lng = parseFloat(premise.longitude);
          const rad = parseFloat(premise.service_radius || radius);
          
          return Sequelize.where(
            Sequelize.literal(`
              6371 * ACOS(
                COS(RADIANS(${lat})) * 
                COS(RADIANS(user_address.latitude)) * 
                COS(RADIANS(user_address.longitude) - RADIANS(${lng})) + 
                SIN(RADIANS(${lat})) * 
                SIN(RADIANS(user_address.latitude))
              )
            `),
            '<=',
            rad
          );
        });
        
        const offset = (page - 1) * limit;
        
        const requests = await CollectionRequest.findAndCountAll({
          where: { status: 'pending' },
          include: [
            {
              model: RequestItem,
              include: [
                { model: Category },
                { model: RequestImage }
              ]
            },
            {
              model: UserAddress,
              where: {
                [Op.or]: locationConditions
              },
              required: true
            },
            {
              model: User,
              attributes: ['id', 'full_name', 'email', 'phone']
            }
          ],
          order: [['created_at', 'DESC']],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        
        // Calculate distances
        const requestsWithDistance = requests.rows.map(request => {
          const requestData = request.toJSON();
          const userAddress = requestData.UserAddress;
          
          // Find nearest premise and calculate distance
          let minDistance = Infinity;
          let nearestPremise = null;
          
          premises.forEach(premise => {
            const distance = calculateDistance(
              parseFloat(premise.latitude),
              parseFloat(premise.longitude),
              parseFloat(userAddress.latitude),
              parseFloat(userAddress.longitude)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestPremise = premise;
            }
          });
          
          requestData.distance_km = minDistance;
          requestData.nearest_premise = nearestPremise;
          
          return requestData;
        });
        
        res.json({
          success: true,
          data: {
            requests: requestsWithDistance,
            pagination: {
              total: requests.count,
              page: parseInt(page),
              totalPages: Math.ceil(requests.count / limit)
            }
          }
        });
      } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Accept request
    static async acceptRequest(req, res) {
      try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { admin_notes, scheduled_pickup_time } = req.body;
        
        const request = await CollectionRequest.findByPk(id, {
          include: [
            {
              model: UserAddress,
              required: true
            }
          ]
        });
        
        if (!request) {
          return res.status(404).json({
            success: false,
            message: 'Request not found'
          });
        }        
        
        // Update request
        request.status = 'accepted';
        request.admin_notes = admin_notes;
        
        if (scheduled_pickup_time) {
          request.scheduled_pickup_time = scheduled_pickup_time;
          request.status = 'scheduled';
        }
        
        await request.save();
        
        // Create notification for user
        await Notification.create({
          user_id: request.user_id,
          title: 'Request Accepted',
          message: `Your scrap collection request ${request.request_number} has been accepted.`,
          type: 'request_update',
          related_request_id: request.id
        });
        
        res.json({
          success: true,
          message: 'Request accepted successfully'
        });
      } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Reject request
    static async rejectRequest(req, res) {
      try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { rejection_reason } = req.body;
        
        if (!rejection_reason) {
          return res.status(400).json({
            success: false,
            message: 'Rejection reason is required'
          });
        }
        
        const request = await CollectionRequest.findByPk(id);
        
        if (!request) {
          return res.status(404).json({
            success: false,
            message: 'Request not found'
          });
        }
        
        if (request.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: 'Only pending requests can be rejected'
          });
        }
        
        // Update request
        request.status = 'rejected';
        request.rejection_reason = rejection_reason;
        await request.save();
        
        // Create notification for user
        await Notification.create({
          user_id: request.user_id,
          title: 'Request Rejected',
          message: `Your scrap collection request ${request.request_number} has been rejected. Reason: ${rejection_reason}`,
          type: 'request_update',
          related_request_id: request.id
        });
        
        res.json({
          success: true,
          message: 'Request rejected successfully'
        });
      } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Get all requests for admin
    static async getAllRequests(req, res) {
      try {
        const adminId = req.user.id;
        const { 
          status, 
          startDate, 
          endDate, 
          page = 1, 
          limit = 10 
        } = req.query;
        
        const where = {};
        if (status) where.status = status;
        
        // Date filter
        if (startDate || endDate) {
          where.created_at = {};
          if (startDate) where.created_at[Op.gte] = new Date(startDate);
          if (endDate) where.created_at[Op.lte] = new Date(endDate);
        }
        
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
            {
              model: UserAddress,
              required: true
            },
            {
              model: User,
              attributes: ['id', 'full_name', 'email', 'phone']
            }
            
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
        console.error('Get all requests error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  
    // Get dashboard statistics
    static async getDashboardStats(req, res) {
      try {
        const adminId = req.user.id;
        
        // Get counts by status
        const counts = await CollectionRequest.findAll({
          attributes: [
            'status',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
          ],
          group: ['status']
        });
        // Get today's requests
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();
        
        const todayRequests = await CollectionRequest.count({
          where: {
            created_at: {
              [Op.between]: [todayStart, todayEnd]
            }
          }
        });
        
        // Get weekly statistics
        const weekStart = moment().startOf('week').toDate();
        const weeklyStats = await CollectionRequest.findAll({
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
          ],
          where: {
            created_at: {
              [Op.gte]: weekStart
            }
          },
          group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
          order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']]
        });
        
        // Get top categories
        const topCategories = await RequestItem.findAll({
          attributes: [
            'category_id',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
          ],
          include: [{
            model: Category,
            attributes: ['name']
          }],
          group: ['category_id'],
          order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
          limit: 5
        });
        
        res.json({
          success: true,
          data: {
            status_counts: counts,
            today_requests: todayRequests,
            weekly_stats: weeklyStats,
            top_categories: topCategories
          }
        });
      } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
    }
  
  // Helper function to calculate distance between two coordinates (Haversine formula)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  function toRad(degrees) {
    return degrees * (Math.PI/180);
  }
  
  module.exports = AdminController;