const express = require('express');
const router = express.Router();
const mainFooterController = require('../controllers/mainFooterController');
const authMiddleware = require('../middleware/auth');

// Routes for main footer management
// Create a new main footer (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  mainFooterController.createMainFooter
);

// Get all main footers
router.get('/', mainFooterController.getAllMainFooters);

// Get main footer by ID
router.get('/:id', mainFooterController.getMainFooterById);

// Update main footer (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  mainFooterController.updateMainFooter
);

// Delete main footer (protected route)
router.delete('/:id', 
  authMiddleware.verifyToken, 
  mainFooterController.deleteMainFooter
);

module.exports = router;

