const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { verifyToken } = require('../middleware/auth');

// Create a new role - protected route
router.post('/', verifyToken, roleController.createRole);

// Get all roles
router.get('/', roleController.getAllRoles);

// Get role by ID - protected route
router.get('/:id', verifyToken, roleController.getRoleById);

// Update role - protected route
router.put('/:id', verifyToken, roleController.updateRole);

// Delete role - protected route
router.delete('/:id', verifyToken, roleController.deleteRole);

module.exports = router;

