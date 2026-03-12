const express = require('express');
const router = express.Router();
const newAssetsSubTagsController = require('../controllers/newAssetsSubTagsController');
const { verifyToken } = require('../middleware/auth');

// Create a new sub asset with image upload
router.post(
  '/',
  verifyToken,
  newAssetsSubTagsController.uploadNewAssetsSubTagsImage,
  newAssetsSubTagsController.createNewAssetsSubTags
);

// Get all sub assets (optionally filter by ?newassetId=)
router.get('/', verifyToken, newAssetsSubTagsController.getAllNewAssetsSubTags);

// Get a single sub asset by ID
router.get('/:id', verifyToken, newAssetsSubTagsController.getNewAssetsSubTagsById);

// Update sub asset with optional image upload
router.put(
  '/:id',
  verifyToken,
  newAssetsSubTagsController.uploadNewAssetsSubTagsImage,
  newAssetsSubTagsController.updateNewAssetsSubTags
);

// Delete sub asset
router.delete('/:id', verifyToken, newAssetsSubTagsController.deleteNewAssetsSubTags);

module.exports = router;

