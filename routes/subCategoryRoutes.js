const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');
const { verifyToken } = require('../middleware/auth');

// Get all subcategories - public access
router.get('/', subCategoryController.getAllSubCategories);

// Get subcategories by category ID - public access
router.get('/category/:categoryId', subCategoryController.getSubCategoriesByCategory);

// Get subcategory by ID - public access
router.get('/:id', subCategoryController.getSubCategoryById);

// Create new subcategory - protected route
router.post('/', verifyToken, subCategoryController.createSubCategory);

// Update subcategory - protected route
router.put('/:id', verifyToken, subCategoryController.updateSubCategory);

// Delete subcategory - protected route
router.delete('/:id', verifyToken, subCategoryController.deleteSubCategory);

module.exports = router; 