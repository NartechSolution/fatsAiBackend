const express = require('express');
const router = express.Router();
const assetCategoryController = require('../controllers/assetCategoryController');
const authMiddleware = require('../middleware/auth');

// Create a new asset category - Protected
router.post(
  '/',
  authMiddleware.verifyToken,
  assetCategoryController.createAssetCategory
);

// Get all asset categories
router.get('/', assetCategoryController.getAllAssetCategories);

// Get a single asset category by ID
router.get('/:id', assetCategoryController.getAssetCategoryById);

// Update an asset category - Admin protected
router.put(
  '/:id',
  authMiddleware.verifyToken,
  assetCategoryController.updateAssetCategory
);

// Delete an asset category - Admin protected
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  assetCategoryController.deleteAssetCategory
);

module.exports = router;


