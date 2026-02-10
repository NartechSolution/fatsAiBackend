const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/uploadUtils');

// Auth routes
router.post('/signup', authController.signup);
router.post('/create-user', authController.createUser); // Comprehensive signup with subscription support
router.post('/login', authController.login);
router.post('/login/nfc', authController.loginWithNfc);
router.get('/me', authMiddleware.verifyToken, authController.getMe);

// NFC settings route
router.put('/nfc-settings', authMiddleware.verifyToken, authController.updateNfcSettings);

// Profile update route (with image upload support)
router.put('/profile', authMiddleware.verifyToken, upload.single('image'), authController.updateProfile);

// Member management routes (admin access required)
router.get('/members', authMiddleware.verifyToken, memberController.getMembers);
router.get('/members/summary', authMiddleware.verifyToken, memberController.getMembersSummary);
router.get('/members/export',  memberController.exportMembers);
router.get('/members/:id', authMiddleware.verifyToken, memberController.getMemberById);
router.put('/members/:id', authMiddleware.verifyToken, memberController.updateMember);
router.put('/members/:id/status', authMiddleware.verifyToken, memberController.updateMemberStatus);
router.delete('/members/:id', authMiddleware.verifyToken, memberController.deleteMember);
router.get('/members/:id/invoice', authMiddleware.verifyToken, memberController.getMemberInvoice);

module.exports = router;