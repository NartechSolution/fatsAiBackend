const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { verifyToken } = require('../middleware/auth');

// Create a new permission - protected route
router.post('/', verifyToken, permissionController.createPermission);

// Get all permissions
router.get('/', permissionController.getAllPermissions);

// Get permissions grouped by category
router.get('/grouped', permissionController.getPermissionsByCategory);

// Get permissions by category ID
router.get('/category/:categoryId', permissionController.getPermissionsByCategoryId);

// Get permission by ID - protected route
router.get('/:id', verifyToken, permissionController.getPermissionById);

// Update permission - protected route
router.put('/:id', verifyToken, permissionController.updatePermission);

// Delete permission - protected route
router.delete('/:id', verifyToken, permissionController.deletePermission);

module.exports = router;

