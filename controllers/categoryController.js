const { Category } = require('../models');
const { processUploadedFile } = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');

class CategoryController {
  // Create category with icon upload
  static async createCategory(req, res) {
    try {
      const { name, description } = req.body;
      
      // Check if category already exists
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      
      let iconUrl = null;
      
      // Process icon if uploaded
      if (req.file) {
        try {
          const processedIcon = await processUploadedFile(req.file, 'category');
          iconUrl = processedIcon.url;
        } catch (error) {
          console.error('Icon processing error:', error);
          return res.status(500).json({
            success: false,
            message: 'Error processing icon image'
          });
        }
      }
      
      // Create category
      const category = await Category.create({
        name,
        description,
        icon: iconUrl,
        is_active: true
      });
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update category with icon
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;
      
      const category = await Category.findByPk(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      // Check name uniqueness if changing
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
      }
      
      let iconUrl = category.icon;
      
      // Process new icon if uploaded
      if (req.file) {
        try {
          // Delete old icon if exists
          if (category.icon) {
            const oldIconPath = path.join(__dirname, '..', category.icon);
            if (fs.existsSync(oldIconPath)) {
              fs.unlinkSync(oldIconPath);
            }
          }
          
          const processedIcon = await processUploadedFile(req.file, 'category');
          iconUrl = processedIcon.url;
        } catch (error) {
          console.error('Icon processing error:', error);
          return res.status(500).json({
            success: false,
            message: 'Error processing icon image'
          });
        }
      }
      
      // Update category
      await category.update({
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        icon: iconUrl,
        is_active: is_active !== undefined ? is_active : category.is_active
      });
      
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete category (and its icon file)
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      const category = await Category.findByPk(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      // Delete icon file if exists
      if (category.icon) {
        const iconPath = path.join(__dirname, '..', category.icon);
        if (fs.existsSync(iconPath)) {
          fs.unlinkSync(iconPath);
        }
      }
      
      // Delete category from database
      await category.destroy();
      
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get all categories with icon URLs
  static async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll({
        where: { is_active: true },
        attributes: ['id', 'name', 'description', 'icon', 'created_at']
      });
      
      // Convert relative paths to absolute URLs
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const categoriesWithFullUrls = categories.map(category => {
        const categoryData = category.toJSON();
        if (categoryData.icon && !categoryData.icon.startsWith('http')) {
          categoryData.icon = `${baseUrl}/uploads/${categoryData.icon}`;
        }
        return categoryData;
      });
      
      res.json({
        success: true,
        data: categoriesWithFullUrls
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = CategoryController;