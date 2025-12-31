const prisma = require('../prisma/client');

// Get all NotificationAlerts
const getAllNotificationAlerts = async () => {
  return await prisma.notificationAlert.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get NotificationAlert by ID
const getNotificationAlertById = async (id) => {
  return await prisma.notificationAlert.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create new NotificationAlert
const createNotificationAlert = async (data) => {
  return await prisma.notificationAlert.create({
    data: {
      emailNotification: data.emailNotification !== undefined ? data.emailNotification : false,
      pushNotification: data.pushNotification !== undefined ? data.pushNotification : false,
      dailySummaryEmail: data.dailySummaryEmail !== undefined ? data.dailySummaryEmail : false,
      notificationSound: data.notificationSound !== undefined ? data.notificationSound : false,
    },
  });
};

// Update NotificationAlert
const updateNotificationAlert = async (id, data) => {
  const updateData = {
    emailNotification: data.emailNotification,
    pushNotification: data.pushNotification,
    dailySummaryEmail: data.dailySummaryEmail,
    notificationSound: data.notificationSound,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  return await prisma.notificationAlert.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
  });
};

// Delete NotificationAlert
const deleteNotificationAlert = async (id) => {
  return await prisma.notificationAlert.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllNotificationAlerts,
  getNotificationAlertById,
  createNotificationAlert,
  updateNotificationAlert,
  deleteNotificationAlert,
};

