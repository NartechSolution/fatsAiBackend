const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderController');
const authMiddleware = require('../middleware/auth');

// Routes for slider
// Create a new slider (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  sliderController.createSlider
);

// Get all sliders
router.get('/', sliderController.getAllSliders);

// Get slider by ID
router.get('/:id', sliderController.getSliderById);

// Update slider (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  sliderController.updateSlider
);

// Delete slider (protected route)
router.delete('/:id', 
  authMiddleware.verifyToken, 
  sliderController.deleteSlider
);

module.exports = router;

