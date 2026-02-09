const express = require('express');
const router = express.Router();
const demoRequestController = require('../controllers/demoRequestController');
const { verifyToken } = require('../middleware/auth');

// Admin-only routes for managing demo requests
router.get('/demo-requests', verifyToken, demoRequestController.getAllDemoRequests);
router.get('/demo-requests/:id', verifyToken, demoRequestController.getDemoRequestById);
router.put('/demo-requests/:id', verifyToken, demoRequestController.updateDemoRequest);
router.delete('/demo-requests/:id', verifyToken, demoRequestController.deleteDemoRequest);

module.exports = router;
