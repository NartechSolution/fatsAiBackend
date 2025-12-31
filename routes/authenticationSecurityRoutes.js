const express = require('express');
const router = express.Router();
const authenticationSecurityController = require('../controllers/authenticationSecurityController');
const { verifyToken } = require('../middleware/auth');

// Get all authentication securities
router.get('/', authenticationSecurityController.getAllAuthenticationSecurities);

// Get authentication security by ID
router.get('/:id', authenticationSecurityController.getAuthenticationSecurityById);

// Create new authentication security (protected route)
router.post('/', authenticationSecurityController.createAuthenticationSecurity);

// Update authentication security (protected route)
router.put('/:id', authenticationSecurityController.updateAuthenticationSecurity);

// Delete authentication security (protected route)
router.delete('/:id', authenticationSecurityController.deleteAuthenticationSecurity);

module.exports = router;

