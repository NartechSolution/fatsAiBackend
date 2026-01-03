const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

// Log Routes
router.get('/logs', auditLogController.getLogs);
router.post('/logs', auditLogController.createLog);

// Setting Routes
router.get('/settings', auditLogController.getSettings);
router.put('/settings', auditLogController.updateSettings);

module.exports = router;
