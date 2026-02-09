const express = require('express');
const router = express.Router();
const categoryManagementTypeController = require('../controllers/categoryManagementTypeController');
const authMiddleware = require('../middleware/auth');

// Routes for category management type
// Create a new category management type (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  categoryManagementTypeController.createCategoryManagementType
);

// Get all category management types
router.get('/', categoryManagementTypeController.getAllCategoryManagementTypes);

// Get category management type by ID
router.get('/:id', categoryManagementTypeController.getCategoryManagementTypeById);

// Update category management type (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  categoryManagementTypeController.updateCategoryManagementType
);

// Delete category management type (protected route)
router.delete('/:id', 
  authMiddleware.verifyToken, 
  categoryManagementTypeController.deleteCategoryManagementType
);

module.exports = router;

