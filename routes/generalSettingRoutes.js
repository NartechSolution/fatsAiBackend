const express = require('express');
const router = express.Router();
const generalSettingController = require('../controllers/generalSettingController');
const { verifyToken } = require('../middleware/auth');

// Get all general settings
router.get('/', generalSettingController.getAllGeneralSettings);

// Get general setting by ID
router.get('/:id', generalSettingController.getGeneralSettingById);

// Create new general setting (protected route)
router.post('/', generalSettingController.createGeneralSetting);

// Update general setting (protected route)
router.put('/:id', generalSettingController.updateGeneralSetting);

// Delete general setting (protected route)
router.delete('/:id', generalSettingController.deleteGeneralSetting);

module.exports = router;

