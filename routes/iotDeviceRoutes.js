const express = require('express');
const router = express.Router();
const iotDeviceController = require('../controllers/iotDeviceController');
const authMiddleware = require('../middleware/auth');

// Routes for IoT device management
// Create a new IoT device with image upload (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  iotDeviceController.uploadIotDeviceImage,
  iotDeviceController.createIotDevice
);

// Get all IoT devices
router.get('/', iotDeviceController.getAllIotDevices);

// Get IoT device by ID
router.get('/:id', iotDeviceController.getIotDeviceById);

// Update IoT device with image upload (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  iotDeviceController.uploadIotDeviceImage,
  iotDeviceController.updateIotDevice
);

// Delete IoT device (protected route)
router.delete('/:id', authMiddleware.verifyToken, iotDeviceController.deleteIotDevice);

module.exports = router;