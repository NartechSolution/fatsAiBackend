const express = require('express');
const router = express.Router();
const mainCategoryManagementController = require('../controllers/mainCategoryManagementController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/uploadUtils');

// Routes for main category management
// Create a new main category management (protected route with file upload)
router.post('/',
  authMiddleware.verifyToken,
  upload.single('icon'),
  mainCategoryManagementController.createMainCategoryManagement
);

// Get all main category managements (with optional filters)
router.get('/', mainCategoryManagementController.getAllMainCategoryManagements);

// Get categories in tree format (for Tree View)
router.get('/tree', mainCategoryManagementController.getCategoriesTree);

// Get categories in table format (for Table View)
router.get('/table', mainCategoryManagementController.getCategoriesTable);

// Search categories
router.get('/search', mainCategoryManagementController.searchCategories);

// Get filter options (for dropdowns)
router.get('/filters', mainCategoryManagementController.getFilterOptions);

// Duplicate a category
router.post('/:id/duplicate',
  authMiddleware.verifyToken,
  mainCategoryManagementController.duplicateCategory
);

// Get main category managements by parent category
router.get('/parent/:parentCategoryId', mainCategoryManagementController.getMainCategoryManagementsByParent);

// Get main category management by ID
router.get('/:id', mainCategoryManagementController.getMainCategoryManagementById);

// Update main category management (protected route with file upload)
router.put('/:id',
  authMiddleware.verifyToken,
  upload.single('icon'),
  mainCategoryManagementController.updateMainCategoryManagement
);

// Delete main category management (protected route)
router.delete('/:id',
  authMiddleware.verifyToken,
  mainCategoryManagementController.deleteMainCategoryManagement
);

module.exports = router;

