const express = require('express');
const router = express.Router();
const subFooterController = require('../controllers/subFooterController');
const authMiddleware = require('../middleware/auth');

// Routes for sub footer management
// Create a new sub footer (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  subFooterController.createSubFooter
);

// Get all sub footers
router.get('/', subFooterController.getAllSubFooters);

// Get sub footer by ID
router.get('/:id', subFooterController.getSubFooterById);

// Update sub footer (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  subFooterController.updateSubFooter
);

// Delete sub footer (protected route)
router.delete('/:id', 
  authMiddleware.verifyToken, 
  subFooterController.deleteSubFooter
);

module.exports = router;

