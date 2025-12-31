const express = require('express');
const router = express.Router();
const settingRolePermissionController = require('../controllers/settingRolePermissionController');
const { verifyToken } = require('../middleware/auth');

// Get all setting role permissions
router.get('/', settingRolePermissionController.getAllSettingRolePermissions);

// Get setting role permission by ID
router.get('/:id', settingRolePermissionController.getSettingRolePermissionById);

// Create new setting role permission (protected route)
router.post('/', settingRolePermissionController.createSettingRolePermission);

// Update setting role permission (protected route)
router.put('/:id', settingRolePermissionController.updateSettingRolePermission);

// Delete setting role permission (protected route)
router.delete('/:id', settingRolePermissionController.deleteSettingRolePermission);

module.exports = router;

