const express = require('express');
const router = express.Router();
const dataManagementController = require('../controllers/dataManagementController');
const { uploadDocuments } = require('../utils/uploadUtils');

// Routes
router.post('/', uploadDocuments.single('file'), dataManagementController.create);
router.get('/', dataManagementController.getAll);
router.get('/:id', dataManagementController.getById);
router.put('/:id', uploadDocuments.single('file'), dataManagementController.update);
router.delete('/:id', dataManagementController.delete);

module.exports = router;
