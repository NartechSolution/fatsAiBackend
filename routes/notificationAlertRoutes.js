const express = require('express');
const router = express.Router();
const notificationAlertController = require('../controllers/notificationAlertController');
const { verifyToken } = require('../middleware/auth');

// Get all notification alerts
router.get('/', notificationAlertController.getAllNotificationAlerts);

// Get notification alert by ID
router.get('/:id', notificationAlertController.getNotificationAlertById);

// Create new notification alert (protected route)
router.post('/', notificationAlertController.createNotificationAlert);

// Update notification alert (protected route)
router.put('/:id', notificationAlertController.updateNotificationAlert);

// Delete notification alert (protected route)
router.delete('/:id', notificationAlertController.deleteNotificationAlert);

module.exports = router;

