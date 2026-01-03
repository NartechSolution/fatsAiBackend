const express = require('express');
const router = express.Router();
const systemHealthController = require('../controllers/systemHealthController');

router.get('/', systemHealthController.getSystemHealth);
router.post('/diagnostics', systemHealthController.runDiagnostics);

module.exports = router;
