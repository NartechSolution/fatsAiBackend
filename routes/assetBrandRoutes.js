const express = require('express');
const router = express.Router();
const assetBrandController = require('../controllers/assetBrandController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/uploadUtils');

// Create a new asset brand - Protected, with logo file (multipart/form-data)
router.post(
  '/',
  authMiddleware.verifyToken,
  upload.single('logo'),
  assetBrandController.createAssetBrand
);

// Get all asset brands
router.get('/', assetBrandController.getAllAssetBrands);

// Get a single asset brand by ID
router.get('/:id', assetBrandController.getAssetBrandById);

// Update an asset brand - Admin protected, logo optional
router.put(
  '/:id',
  authMiddleware.verifyToken,
  upload.single('logo'),
  assetBrandController.updateAssetBrand
);

// Delete an asset brand - Admin protected
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  assetBrandController.deleteAssetBrand
);

module.exports = router;


