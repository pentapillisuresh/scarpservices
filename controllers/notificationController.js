const { Notification, User } = require('../models');
const { Op } = require('sequelize');

class NotificationController {
  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, unread_only = false } = req.query;
      
      const where = { user_id: userId };
      if (unread_only === 'true') {
        where.is_read = false;
      }
      
      const offset = (page - 1) * limit;
      
      const notifications = await Notification.findAndCountAll({
        where,
        include: [{
          model: User,
          attributes: ['id', 'full_name']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // Get unread count
      const unreadCount = await Notification.count({
        where: { user_id: userId, is_read: false }
      });
      
      res.json({
        success: true,
        data: {
          notifications: notifications.rows,
          unread_count: unreadCount,
          pagination: {
            total: notifications.count,
            page: parseInt(page),
            totalPages: Math.ceil(notifications.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const notification = await Notification.findOne({
        where: { id, user_id: userId }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
      
      await notification.update({ is_read: true });
      
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      
      await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
      );
      
      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const notification = await Notification.findOne({
        where: { id, user_id: userId }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
      
      await notification.destroy();
      
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Clear all notifications
  static async clearAllNotifications(req, res) {
    try {
      const userId = req.user.id;
      
      await Notification.destroy({
        where: { user_id: userId }
      });
      
      res.json({
        success: true,
        message: 'All notifications cleared'
      });
    } catch (error) {
      console.error('Clear all notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = NotificationController;