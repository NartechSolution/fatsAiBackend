const express = require('express');
const router = express.Router();
const resourceCategoryController = require('../controllers/resourceCategoryController');
const { verifyToken } = require('../middleware/auth');

// Get all resource categories
router.get('/', resourceCategoryController.getAllResourceCategories);

// Get resource category by ID
router.get('/:id', resourceCategoryController.getResourceCategoryById);

// Create new resource category (protected route)
router.post('/', resourceCategoryController.createResourceCategory);

// Update resource category (protected route)
router.put('/:id', resourceCategoryController.updateResourceCategory);

// Delete resource category (protected route)
router.delete('/:id', resourceCategoryController.deleteResourceCategory);

module.exports = router;

