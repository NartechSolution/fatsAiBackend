const notificationAlertModel = require('../models/notificationAlert');
const { createError } = require('../utils/createError');

// Get all NotificationAlerts
const getAllNotificationAlerts = async (req, res, next) => {
  try {
    const notificationAlerts = await notificationAlertModel.getAllNotificationAlerts();
    
    res.status(200).json({
      success: true,
      data: notificationAlerts
    });
  } catch (error) {
    next(createError(500, 'Error retrieving notification alerts'));
  }
};

// Get NotificationAlert by ID
const getNotificationAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificationAlert = await notificationAlertModel.getNotificationAlertById(id);
    
    if (!notificationAlert) {
      return next(createError(404, 'Notification alert not found'));
    }
    
    res.status(200).json({
      success: true,
      data: notificationAlert
    });
  } catch (error) {
    next(createError(500, 'Error retrieving notification alert'));
  }
};

// Create new NotificationAlert
const createNotificationAlert = async (req, res, next) => {
  try {
    const { 
      emailNotification,
      pushNotification,
      dailySummaryEmail,
      notificationSound
    } = req.body;
    
    // Convert boolean strings to booleans
    const convertToBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    // Prepare data for database
    const notificationAlertData = {
      emailNotification: convertToBoolean(emailNotification),
      pushNotification: convertToBoolean(pushNotification),
      dailySummaryEmail: convertToBoolean(dailySummaryEmail),
      notificationSound: convertToBoolean(notificationSound),
    };
    
    const newNotificationAlert = await notificationAlertModel.createNotificationAlert(notificationAlertData);
    
    res.status(201).json({
      success: true,
      data: newNotificationAlert
    });
  } catch (error) {
    console.error('Error creating notification alert:', error);
    next(createError(500, `Error creating notification alert: ${error.message}`));
  }
};

// Update NotificationAlert
const updateNotificationAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      emailNotification,
      pushNotification,
      dailySummaryEmail,
      notificationSound
    } = req.body;
    
    // Check if NotificationAlert exists
    const existingNotificationAlert = await notificationAlertModel.getNotificationAlertById(id);
    if (!existingNotificationAlert) {
      return next(createError(404, 'Notification alert not found'));
    }
    
    // Convert boolean strings to booleans
    const convertToBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    // Prepare data for database
    const notificationAlertData = {
      emailNotification: emailNotification !== undefined ? convertToBoolean(emailNotification) : undefined,
      pushNotification: pushNotification !== undefined ? convertToBoolean(pushNotification) : undefined,
      dailySummaryEmail: dailySummaryEmail !== undefined ? convertToBoolean(dailySummaryEmail) : undefined,
      notificationSound: notificationSound !== undefined ? convertToBoolean(notificationSound) : undefined,
    };
    
    const updatedNotificationAlert = await notificationAlertModel.updateNotificationAlert(id, notificationAlertData);
    
    res.status(200).json({
      success: true,
      data: updatedNotificationAlert
    });
  } catch (error) {
    console.error('Error updating notification alert:', error);
    next(createError(500, `Error updating notification alert: ${error.message}`));
  }
};

// Delete NotificationAlert
const deleteNotificationAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if NotificationAlert exists
    const existingNotificationAlert = await notificationAlertModel.getNotificationAlertById(id);
    if (!existingNotificationAlert) {
      return next(createError(404, 'Notification alert not found'));
    }
    
    // Delete the NotificationAlert
    await notificationAlertModel.deleteNotificationAlert(id);
    
    res.status(200).json({
      success: true,
      message: 'Notification alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification alert:', error);
    next(createError(500, `Error deleting notification alert: ${error.message}`));
  }
};

module.exports = {
  getAllNotificationAlerts,
  getNotificationAlertById,
  createNotificationAlert,
  updateNotificationAlert,
  deleteNotificationAlert
};

