const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, verifyAdminToken } = require('../middleware/auth');

// Member (user) notifications
router.get('/me', verifyToken, notificationController.getMyNotifications);
router.get('/me/unread-count', verifyToken, notificationController.getMyUnreadCount);
router.post('/me/read-all', verifyToken, notificationController.markAllMyNotificationsAsRead);

// Admin notifications
router.get('/admin', verifyAdminToken, notificationController.getAdminNotifications);
router.get('/admin/unread-count', verifyAdminToken, notificationController.getAdminUnreadCount);
router.post('/admin/read-all', verifyAdminToken, notificationController.markAllAdminNotificationsAsRead);

// Common: mark single notification as read
router.post('/:id/read', notificationController.markNotificationAsRead);

module.exports = router;

