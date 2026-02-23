const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// Route to get dashboard statistics
router.get('/stats', verifyToken, dashboardController.getDashboardStats);

router.get('/admin-dashboard/stats', verifyToken, dashboardController.getAdminDashboardStats);

// Route to get IoT sensor data
router.get('/iot-sensors', verifyToken, dashboardController.getIoTSensorData);

module.exports = router;
