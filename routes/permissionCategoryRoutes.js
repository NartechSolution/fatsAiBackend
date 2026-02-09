const express = require('express');
const router = express.Router();
const permissionCategoryController = require('../controllers/permissionCategoryController');
const { verifyToken } = require('../middleware/auth');

// Create a new permission category - protected route
router.post('/', verifyToken, permissionCategoryController.createPermissionCategory);

// Get all permission categories
router.get('/', permissionCategoryController.getAllPermissionCategories);

// Get permission category by ID - protected route
router.get('/:id', verifyToken, permissionCategoryController.getPermissionCategoryById);

// Update permission category - protected route
router.put('/:id', verifyToken, permissionCategoryController.updatePermissionCategory);

// Delete permission category - protected route
router.delete('/:id', verifyToken, permissionCategoryController.deletePermissionCategory);

module.exports = router;

