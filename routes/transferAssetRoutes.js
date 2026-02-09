const express = require('express');
const router = express.Router();
const transferAssetController = require('../controllers/transferAssetController');
const authMiddleware = require('../middleware/auth');

// Routes for transfer asset management
// Create a new transfer asset (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  transferAssetController.createTransferAsset
);

// Get all transfer assets
router.get('/', transferAssetController.getAllTransferAssets);

// Get transfer asset by ID
router.get('/:id', transferAssetController.getTransferAssetById);

// Get transfer assets by IoT device asset ID
router.get('/iot-device-asset/:iotDeviceAssetId', transferAssetController.getTransferAssetsByIotDeviceAssetId);

// Get transfer assets by employee ID
router.get('/employee/:employeeId', transferAssetController.getTransferAssetsByEmployeeId);

// Get transfer history for an IoT device asset
router.get('/history/:iotDeviceAssetId', transferAssetController.getTransferHistory);

// Update transfer asset (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  transferAssetController.updateTransferAsset
);

// Delete transfer asset (protected route)
router.delete('/:id', authMiddleware.verifyToken, transferAssetController.deleteTransferAsset);

module.exports = router;
