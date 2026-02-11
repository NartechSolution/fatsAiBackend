const express = require('express');
const router = express.Router();
const employeeListController = require('../controllers/employeeListController');
const { verifyToken } = require('../middleware/auth');
const { upload, uploadDocuments } = require('../utils/uploadUtils');

// Create a new employee (with image upload)
router.post('/', verifyToken, upload.single('image'), employeeListController.createEmployee);

// Bulk import employees via Excel/CSV file
// Expects multipart/form-data with 'file' as the document field
router.post(
  '/import',
  verifyToken,
  uploadDocuments.single('file'),
  employeeListController.importEmployeesFromExcel
);

// Get all employees
router.get('/', employeeListController.getAllEmployees);

// Get employee by ID
router.get('/:id', employeeListController.getEmployeeById);

// Update employee (with optional image upload)
router.put('/:id', verifyToken, upload.single('image'), employeeListController.updateEmployee);

// Delete employee
router.delete('/:id', verifyToken, employeeListController.deleteEmployee);

module.exports = router; 