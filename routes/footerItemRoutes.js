const express = require('express');
const router = express.Router();
const footerItemController = require('../controllers/footerItemController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/uploadUtils');

// Routes for footer item management
// Create a new footer item (protected route with file upload)
router.post('/',
  authMiddleware.verifyToken,
  upload.single('icon'),
  footerItemController.createFooterItem
);

// Get all footer items
router.get('/', footerItemController.getAllFooterItems);

// Get footer item by ID
router.get('/:id', footerItemController.getFooterItemById);

// Update footer item (protected route with file upload)
router.put('/:id',
  authMiddleware.verifyToken,
  upload.single('icon'),
  footerItemController.updateFooterItem
);

// Delete footer item (protected route)
router.delete('/:id',
  authMiddleware.verifyToken,
  footerItemController.deleteFooterItem
);

module.exports = router;

