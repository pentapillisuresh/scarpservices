const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadCategoryIcon } = require('../middlewares/upload');

// Public routes
router.get('/', CategoryController.getAllCategories);
// router.get('/:id', CategoryController.getCategoryById);

// Admin routes (require authentication and admin role)
router.post('/', protect, authorize('admin'), uploadCategoryIcon, CategoryController.createCategory);
router.put('/:id', protect, authorize('admin'), uploadCategoryIcon, CategoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), CategoryController.deleteCategory);
// router.get('/admin/all', protect, authorize('admin'), CategoryController.getAllCategoriesAdmin);

module.exports = router;