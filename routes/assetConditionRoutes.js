const express = require('express');
const router = express.Router();
const assetConditionController = require('../controllers/assetConditionController');
const authMiddleware = require('../middleware/auth');

// Create a new asset condition - Protected route
router.post('/', authMiddleware.verifyToken, assetConditionController.createAssetCondition);

// Get all asset conditions
router.get('/', assetConditionController.getAllAssetConditions);

// Get a single asset condition by ID
router.get('/:id', assetConditionController.getAssetConditionById);

// Update an asset condition - Protected route
router.put('/:id', authMiddleware.verifyToken, assetConditionController.updateAssetCondition);

// Delete an asset condition - Protected route
router.delete('/:id', authMiddleware.verifyToken, assetConditionController.deleteAssetCondition);

module.exports = router; 