const express = require('express');
const router = express.Router();
const assetTypeController = require('../controllers/assetTypeController');
const authMiddleware = require('../middleware/auth');

// Routes for asset type management
// Create a new asset type (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  assetTypeController.createAssetType
);

// Get all asset types
router.get('/', assetTypeController.getAllAssetTypes);

// Get asset type by ID
router.get('/:id', assetTypeController.getAssetTypeById);

// Update asset type (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  assetTypeController.updateAssetType
);

// Delete asset type (protected route)
router.delete('/:id', authMiddleware.verifyToken, assetTypeController.deleteAssetType);

module.exports = router;
