const express = require('express');
const router = express.Router();
const assetMovementController = require('../controllers/assetMovementController');
const { verifyToken } = require('../middleware/auth');

// Create one or many asset movements
router.post(
  '/',
  verifyToken,
  assetMovementController.createAssetMovements
);

// Get all asset movements (optional filters: ?newassetId=&locationTagId=)
router.get('/', assetMovementController.getAllAssetMovements);

// Get a single asset movement by id
router.get('/:id', assetMovementController.getAssetMovementById);

// Update asset movement
router.put(
  '/:id',
  verifyToken,
  assetMovementController.updateAssetMovement
);

// Delete asset movement
router.delete(
  '/:id',
  verifyToken,
  assetMovementController.deleteAssetMovement
);

module.exports = router;

