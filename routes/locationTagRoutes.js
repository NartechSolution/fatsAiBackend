const express = require('express');
const router = express.Router();
const locationTagController = require('../controllers/locationTagController');
const { verifyToken } = require('../middleware/auth');

// POST - Create a new location tag (protected route)
router.post('/', verifyToken, locationTagController.createLocationTag);

// GET - Get all location tags
router.get('/', locationTagController.getAllLocationTags);

// GET - Get location tag by ID
router.get('/:id', locationTagController.getLocationTagById);

// PUT - Update location tag (protected route)
router.put('/:id', verifyToken, locationTagController.updateLocationTag);

// DELETE - Delete location tag (protected route)
router.delete('/:id', verifyToken, locationTagController.deleteLocationTag);

module.exports = router;
