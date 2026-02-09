const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const {  verifyToken } = require('../middleware/auth');

// Create a new city - admin only
router.post('/', verifyToken,  cityController.createCity);

// Get all cities - any authenticated user (member or admin)
router.get('/', verifyToken, cityController.getAllCities);

// Get city by ID - any authenticated user (member or admin)
router.get('/:id', verifyToken, cityController.getCityById);

// Update city - admin only
router.put('/:id', verifyToken,  cityController.updateCity);

// Delete city - admin only
router.delete('/:id', verifyToken,  cityController.deleteCity);

module.exports = router;


