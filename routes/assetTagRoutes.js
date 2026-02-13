const express = require('express');
const router = express.Router();
const assetTagController = require('../controllers/assetTagController');
const { verifyToken } = require('../middleware/auth');

// POST - Create a new asset tag (protected route)
router.post('/', verifyToken, assetTagController.createAssetTag);

// GET - Get all asset tags (with optional filter by newassetId)
router.get('/', assetTagController.getAllAssetTags);

// GET - Get asset tag by ID
router.get('/:id', assetTagController.getAssetTagById);

// PUT - Update asset tag (protected route)
router.put('/:id', verifyToken, assetTagController.updateAssetTag);

// DELETE - Delete asset tag (protected route)
router.delete('/:id', verifyToken, assetTagController.deleteAssetTag);

module.exports = router;
