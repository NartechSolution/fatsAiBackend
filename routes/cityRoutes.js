const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const { verifyAdminToken, verifyToken } = require('../middleware/auth');

// Create a new city - protected
router.post('/', verifyAdminToken, verifyToken, cityController.createCity);

// Get all cities - protected
router.get('/', verifyAdminToken, verifyToken, cityController.getAllCities);

// Get city by ID - protected
router.get('/:id', verifyAdminToken, verifyToken, cityController.getCityById);

// Update city - protected
router.put('/:id', verifyAdminToken, verifyToken, cityController.updateCity);

// Delete city - protected
router.delete('/:id', verifyAdminToken, verifyToken, cityController.deleteCity);

module.exports = router;


