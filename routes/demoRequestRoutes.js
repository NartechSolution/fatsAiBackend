const express = require('express');
const router = express.Router();
const demoRequestController = require('../controllers/demoRequestController');
const { verifyToken } = require('../middleware/auth');

// Public route for creating demo requests
router.post('/', demoRequestController.createDemoRequest);

// Admin-only routes for managing demo requests
router.get('/', verifyToken, demoRequestController.getAllDemoRequests);
router.get('/:id', verifyToken, demoRequestController.getDemoRequestById);
router.put('/:id', verifyToken, demoRequestController.updateDemoRequest);
router.delete('/:id', verifyToken, demoRequestController.deleteDemoRequest);

module.exports = router;
