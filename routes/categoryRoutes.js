const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/auth');

// Get all categories - public access
router.get('/', categoryController.getAllCategories);

// Get category by ID - public access
router.get('/:id', categoryController.getCategoryById);

// Create new category - protected route
router.post('/', verifyToken, categoryController.createCategory);

// Update category - protected route
router.put('/:id', verifyToken, categoryController.updateCategory);

// Delete category - protected route
router.delete('/:id', verifyToken, categoryController.deleteCategory);

module.exports = router; 