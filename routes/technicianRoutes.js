const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const authMiddleware = require('../middleware/auth');

// Routes for technician management
// Create a new technician (protected route)
router.post('/', 
  authMiddleware.verifyToken, 
  technicianController.createTechnician
);

// Get all technicians
router.get('/', technicianController.getAllTechnicians);

// Get active technicians only
router.get('/active', technicianController.getActiveTechnicians);

// Get technician by ID
router.get('/:id', technicianController.getTechnicianById);

// Update technician (protected route)
router.put('/:id', 
  authMiddleware.verifyToken, 
  technicianController.updateTechnician
);

// Update technician status (protected route)
router.patch('/:id/status', 
  authMiddleware.verifyToken, 
  technicianController.updateTechnicianStatus
);

// Delete technician (protected route)
router.delete('/:id', authMiddleware.verifyToken, technicianController.deleteTechnician);

module.exports = router;
