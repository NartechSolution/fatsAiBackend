const express = require('express');
const router = express.Router();
const headOfDepartmentController = require('../controllers/headOfDepartmentController');
const { verifyToken } = require('../middleware/auth');

// Create a new head of department - protected route
router.post('/', verifyToken, headOfDepartmentController.createHeadOfDepartment);

// Get all heads of department with pagination - protected route
router.get('/', headOfDepartmentController.getAllHeadsOfDepartment);

// Get head of department by ID - protected route
router.get('/:id', verifyToken, headOfDepartmentController.getHeadOfDepartmentById);

// Update head of department - protected route
router.put('/:id', verifyToken, headOfDepartmentController.updateHeadOfDepartment);

// Delete head of department - protected route
router.delete('/:id', verifyToken, headOfDepartmentController.deleteHeadOfDepartment);

module.exports = router;

