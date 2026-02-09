const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken } = require('../middleware/auth');

// Create a new department - protected route
router.post('/', verifyToken, departmentController.createDepartment);

// Get all departments with pagination - protected route
router.get('/',  departmentController.getAllDepartments);

// Get department by ID - protected route
router.get('/:id', verifyToken, departmentController.getDepartmentById);

// Update department - protected route
router.put('/:id', verifyToken, departmentController.updateDepartment);

// Delete department - protected route
router.delete('/:id', verifyToken, departmentController.deleteDepartment);

module.exports = router; 