const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');
const { verifyToken } = require('../middleware/auth');

// Create a new floor
router.post('/', verifyToken, floorController.createFloor);

// Get all floors
router.get('/', verifyToken, floorController.getAllFloors);

// Get floors by building ID - must come before /:id
router.get('/building/:buildingId', verifyToken, floorController.getFloorsByBuildingId);

// Get floor by ID
router.get('/:id', verifyToken, floorController.getFloorById);

// Update floor
router.put('/:id', verifyToken, floorController.updateFloor);

// Delete floor
router.delete('/:id', verifyToken, floorController.deleteFloor);

module.exports = router;


