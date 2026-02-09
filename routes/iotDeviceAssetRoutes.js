const express = require('express');
const router = express.Router();
const iotDeviceAssetController = require('../controllers/iotDeviceAssetController');
const authMiddleware = require('../middleware/auth');

// Routes for IoT device asset management
// Create a new IoT device asset (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  iotDeviceAssetController.createIotDeviceAsset
);

// Get all IoT device assets
router.get('/', iotDeviceAssetController.getAllIotDeviceAssets);

// Get IoT device asset by ID
router.get('/:id', iotDeviceAssetController.getIotDeviceAssetById);

// Get IoT device assets by IoT device ID
router.get('/device/:iotDeviceId', iotDeviceAssetController.getIotDeviceAssetsByDeviceId);

// Get IoT device assets by asset type ID
router.get('/asset-type/:assetTypeId', iotDeviceAssetController.getIotDeviceAssetsByAssetTypeId);

// Update IoT device asset (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  iotDeviceAssetController.updateIotDeviceAsset
);

// Delete IoT device asset (protected route)
router.delete('/:id', authMiddleware.verifyToken, iotDeviceAssetController.deleteIotDeviceAsset);

module.exports = router;
