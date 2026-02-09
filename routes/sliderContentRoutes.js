const express = require('express');
const router = express.Router();
const sliderContentController = require('../controllers/sliderContentController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/uploadUtils');

// Routes for slider content
// Create a new slider content (protected route with file upload)
router.post('/', 
  authMiddleware.verifyToken,
  upload.single('backgroundImage'),
  sliderContentController.createSliderContent
);

// Get all slider contents
router.get('/', sliderContentController.getAllSliderContents);

// Get slider contents by slider ID
router.get('/slider/:sliderId', sliderContentController.getSliderContentsBySliderId);

// Get slider content by ID
router.get('/:id', sliderContentController.getSliderContentById);

// Update slider content (protected route with file upload)
router.put('/:id', 
  authMiddleware.verifyToken,
  upload.single('backgroundImage'),
  sliderContentController.updateSliderContent
);

// Delete slider content (protected route)
router.delete('/:id', 
  authMiddleware.verifyToken,
  sliderContentController.deleteSliderContent
);

module.exports = router;

