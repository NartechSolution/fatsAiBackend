const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken } = require('../middleware/auth');

// Get all resources
router.get('/', resourceController.getAllResources);

// Get resources by category ID
router.get('/category/:categoryId', resourceController.getResourcesByCategoryId);

// Get resource by ID
router.get('/:id', resourceController.getResourceById);

// Create new resource (protected route)
router.post('/', resourceController.uploadResourceFile, resourceController.createResource);

// Update resource (protected route)
router.put('/:id', resourceController.uploadResourceFile, resourceController.updateResource);

// Delete resource (protected route)
router.delete('/:id', resourceController.deleteResource);

module.exports = router;

