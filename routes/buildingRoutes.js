const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const { verifyToken } = require('../middleware/auth');

// Create a new building
router.post('/', verifyToken, buildingController.createBuilding);

// Get all buildings
router.get('/', verifyToken, buildingController.getAllBuildings);

// Get buildings by city ID - must come before /:id
router.get('/city/:cityId', verifyToken, buildingController.getBuildingsByCityId);

// Get building by ID
router.get('/:id', verifyToken, buildingController.getBuildingById);

// Update building
router.put('/:id', verifyToken, buildingController.updateBuilding);

// Delete building
router.delete('/:id', verifyToken, buildingController.deleteBuilding);

module.exports = router;


