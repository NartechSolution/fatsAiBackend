const express = require('express');
const router = express.Router();
const apiIntegrationController = require('../controllers/apiIntegrationController');
const { verifyToken } = require('../middleware/auth');

// Get all API integrations
router.get('/', apiIntegrationController.getAllApiIntegrations);

// Get API integration by ID
router.get('/:id', apiIntegrationController.getApiIntegrationById);

// Create new API integration (protected route)
router.post('/', apiIntegrationController.createApiIntegration);

// Update API integration (protected route)
router.put('/:id', apiIntegrationController.updateApiIntegration);

// Delete API integration (protected route)
router.delete('/:id', apiIntegrationController.deleteApiIntegration);

module.exports = router;

