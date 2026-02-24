const prisma = require('../prisma/client');

// Create a notification
const createNotification = async (data) => {
  return prisma.notification.create({ data });
};

// Create many notifications at once
const createManyNotifications = async (notifications) => {
  if (!Array.isArray(notifications) || notifications.length === 0) return { count: 0 };
  return prisma.notification.createMany({ data: notifications });
};

// Get notifications for a member (user)
const getUserNotifications = async ({ userId, onlyUnread = false, take = 20, skip = 0 }) => {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(onlyUnread ? { isRead: false } : {})
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });
};

// Get notifications for an admin
const getAdminNotifications = async ({ adminId, onlyUnread = false, take = 20, skip = 0 }) => {
  return prisma.notification.findMany({
    where: {
      adminId,
      ...(onlyUnread ? { isRead: false } : {})
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });
};

// Count unread notifications for a member
const countUserUnreadNotifications = async (userId) => {
  return prisma.notification.count({
    where: { userId, isRead: false }
  });
};

// Count unread notifications for an admin
const countAdminUnreadNotifications = async (adminId) => {
  return prisma.notification.count({
    where: { adminId, isRead: false }
  });
};

// Mark a single notification as read
const markAsRead = async (id) => {
  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
};

// Mark all notifications as read for a member
const markAllUserAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
};

// Mark all notifications as read for an admin
const markAllAdminAsRead = async (adminId) => {
  return prisma.notification.updateMany({
    where: { adminId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
};

module.exports = {
  createNotification,
  createManyNotifications,
  getUserNotifications,
  getAdminNotifications,
  countUserUnreadNotifications,
  countAdminUnreadNotifications,
  markAsRead,
  markAllUserAsRead,
  markAllAdminAsRead
};

