const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { verifyToken } = require('../middleware/auth');

// Create a new location - protected route
router.post('/', verifyToken, locationController.createLocation);

// Get all locations
router.get('/', locationController.getAllLocations);

// Get location by ID
router.get('/:id', locationController.getLocationById);

// Update location - protected route
router.put('/:id', verifyToken, locationController.updateLocation);

// Delete location - protected route
router.delete('/:id', verifyToken, locationController.deleteLocation);

module.exports = router; 