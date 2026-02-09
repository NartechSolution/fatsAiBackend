const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/auth');

// Routes for maintenance management
// Create a new maintenance record (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  maintenanceController.createMaintenance
);

// Get all maintenance records
router.get('/', maintenanceController.getAllMaintenances);

// Get upcoming maintenance records
router.get('/upcoming', maintenanceController.getUpcomingMaintenances);

// Get maintenance records by type
router.get('/type/:maintenanceType', maintenanceController.getMaintenancesByType);

// Get maintenance record by ID
router.get('/:id', maintenanceController.getMaintenanceById);

// Get maintenance records by IoT device asset ID
router.get('/iot-device-asset/:iotDeviceAssetId', maintenanceController.getMaintenancesByIotDeviceAssetId);

// Get maintenance records by technician ID
router.get('/technician/:technicianId', maintenanceController.getMaintenancesByTechnicianId);

// Update maintenance record (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  maintenanceController.updateMaintenance
);

// Delete maintenance record (protected route)
router.delete('/:id', authMiddleware.verifyToken, maintenanceController.deleteMaintenance);

module.exports = router;
