const express = require('express');
const router = express.Router();
const deviceCategoryController = require('../controllers/deviceCategoryController');
const authMiddleware = require('../middleware/auth');

// Routes for device category management
// Create a new device category with image upload (protected route)
router.post('/', 
  authMiddleware.verifyAdminToken, 
  deviceCategoryController.uploadDeviceCategoryImage,
  deviceCategoryController.createDeviceCategory
);

// Get all device categories
router.get('/', deviceCategoryController.getAllDeviceCategories);

// Get device category by ID
router.get('/:id', deviceCategoryController.getDeviceCategoryById);

// Get all IoT devices by category ID
router.get('/:id/devices', deviceCategoryController.getIotDevicesByCategory);

// Update device category with image upload (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  deviceCategoryController.uploadDeviceCategoryImage,
  deviceCategoryController.updateDeviceCategory
);

// Delete device category (protected route)
router.delete('/:id', authMiddleware.verifyToken, deviceCategoryController.deleteDeviceCategory);

module.exports = router;