const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const auth = require('../middleware/auth');
const { upload } = require('../utils/uploadUtils');

// Create a new service - Admin only
router.post('/', auth.verifyToken, upload.single('icon'), serviceController.createService);

// Get all services
router.get('/', serviceController.getAllServices);

// Get service by ID
router.get('/:id', serviceController.getServiceById);

// Update service - Admin only
router.put('/:id', auth.verifyToken, upload.single('icon'), serviceController.updateService);

// Delete service - Admin only
router.delete('/:id', auth.verifyToken, serviceController.deleteService);

module.exports = router;