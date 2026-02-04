const express = require('express');
const router = express.Router();
const newAssetController = require('../controllers/newAssetController');
const { verifyToken } = require('../middleware/auth');

// Create a new asset with image upload
// Expects multipart/form-data with 'image' as file field
router.post(
  '/',
  verifyToken,
  newAssetController.uploadNewAssetImage,
  newAssetController.createNewAsset
);

// Get all new assets
router.get('/', verifyToken, newAssetController.getAllNewAssets);

// Get a single new asset by ID
router.get('/:id', verifyToken, newAssetController.getNewAssetById);

// Update asset with optional image upload
// Expects multipart/form-data with 'image' as file field
router.put(
  '/:id',
  verifyToken,
  newAssetController.uploadNewAssetImage,
  newAssetController.updateNewAsset
);

// Delete asset
router.delete('/:id', verifyToken, newAssetController.deleteNewAsset);

module.exports = router;


