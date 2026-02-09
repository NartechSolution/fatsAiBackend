const express = require('express');
const router = express.Router();
const logMaintenanceController = require('../controllers/logMaintenanceController');
const authMiddleware = require('../middleware/auth');

// Create a new log maintenance record (protected route)
router.post(
  '/',
  authMiddleware.verifyToken,
  logMaintenanceController.createLogMaintenance
);

// Get all log maintenance records
router.get('/', logMaintenanceController.getAllLogMaintenances);

// Get dashboard statistics for log maintenance cards
router.get('/stats', logMaintenanceController.getLogMaintenanceStats);

// Get maintenance by category (for bar chart)
router.get('/by-category', logMaintenanceController.getMaintenanceByCategory);

// Get most repaired asset this month
router.get('/most-repaired', logMaintenanceController.getMostRepairedAsset);

// Get recent maintenance logs
router.get('/recent', logMaintenanceController.getRecentMaintenance);

// Get average downtime
router.get('/avg-downtime', logMaintenanceController.getAvgDowntime);

// Get a single log maintenance record by ID
router.get('/:id', logMaintenanceController.getLogMaintenanceById);

// Update a log maintenance record (admin protected route)
router.put(
  '/:id',
  authMiddleware.verifyToken,
  logMaintenanceController.updateLogMaintenance
);

// Delete a log maintenance record (admin protected route)
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  logMaintenanceController.deleteLogMaintenance
);

module.exports = router;


