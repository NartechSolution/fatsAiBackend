const express = require('express');
const router = express.Router();
const brandingAppearanceController = require('../controllers/brandingAppearanceController');
const { verifyToken } = require('../middleware/auth');

// Get all branding appearances
router.get('/', brandingAppearanceController.getAllBrandingAppearances);

// Get branding appearance by ID
router.get('/:id', brandingAppearanceController.getBrandingAppearanceById);

// Create new branding appearance (protected route)
router.post('/', brandingAppearanceController.uploadLogo, brandingAppearanceController.createBrandingAppearance);

// Update branding appearance (protected route)
router.put('/:id', brandingAppearanceController.uploadLogo, brandingAppearanceController.updateBrandingAppearance);

// Delete branding appearance (protected route)
router.delete('/:id', brandingAppearanceController.deleteBrandingAppearance);

module.exports = router;

