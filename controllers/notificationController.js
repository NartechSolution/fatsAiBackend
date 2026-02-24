const notificationModel = require('../models/notification');
const { createError } = require('../utils/createError');

// Get notifications for logged-in member
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(createError(401, 'Authentication required'));
    }

    const {
      onlyUnread = 'false',
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const onlyUnreadBool =
      typeof onlyUnread === 'string'
        ? onlyUnread.toLowerCase() === 'true' || onlyUnread === '1'
        : Boolean(onlyUnread);

    const [items, total] = await Promise.all([
      notificationModel.getUserNotifications({
        userId,
        onlyUnread: onlyUnreadBool,
        skip,
        take: limitNum
      }),
      notificationModel.countUserUnreadNotifications(userId)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        totalUnread: total
      }
    });
  } catch (error) {
    console.error('Error getting member notifications:', error);
    next(createError(500, 'Error getting notifications'));
  }
};

// Get notifications for logged-in admin
const getAdminNotifications = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) {
      return next(createError(401, 'Admin authentication required'));
    }

    const {
      onlyUnread = 'false',
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const onlyUnreadBool =
      typeof onlyUnread === 'string'
        ? onlyUnread.toLowerCase() === 'true' || onlyUnread === '1'
        : Boolean(onlyUnread);

    const [items, total] = await Promise.all([
      notificationModel.getAdminNotifications({
        adminId,
        onlyUnread: onlyUnreadBool,
        skip,
        take: limitNum
      }),
      notificationModel.countAdminUnreadNotifications(adminId)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        totalUnread: total
      }
    });
  } catch (error) {
    console.error('Error getting admin notifications:', error);
    next(createError(500, 'Error getting notifications'));
  }
};

// Unread count for current member
const getMyUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(createError(401, 'Authentication required'));
    }

    const count = await notificationModel.countUserUnreadNotifications(userId);
    res.status(200).json({
      success: true,
      data: { unread: count }
    });
  } catch (error) {
    console.error('Error getting member unread count:', error);
    next(createError(500, 'Error getting unread count'));
  }
};

// Unread count for current admin
const getAdminUnreadCount = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) {
      return next(createError(401, 'Admin authentication required'));
    }

    const count = await notificationModel.countAdminUnreadNotifications(adminId);
    res.status(200).json({
      success: true,
      data: { unread: count }
    });
  } catch (error) {
    console.error('Error getting admin unread count:', error);
    next(createError(500, 'Error getting unread count'));
  }
};

// Mark one notification as read (member or admin)
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id, 10);
    if (Number.isNaN(notificationId)) {
      return next(createError(400, 'Invalid notification id'));
    }

    const updated = await notificationModel.markAsRead(notificationId);

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(createError(500, 'Error marking notification as read'));
  }
};

// Mark all notifications as read for current member
const markAllMyNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(createError(401, 'Authentication required'));
    }

    const result = await notificationModel.markAllUserAsRead(userId);

    res.status(200).json({
      success: true,
      data: { updated: result.count }
    });
  } catch (error) {
    console.error('Error marking all member notifications as read:', error);
    next(createError(500, 'Error marking notifications as read'));
  }
};

// Mark all notifications as read for current admin
const markAllAdminNotificationsAsRead = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) {
      return next(createError(401, 'Admin authentication required'));
    }

    const result = await notificationModel.markAllAdminAsRead(adminId);

    res.status(200).json({
      success: true,
      data: { updated: result.count }
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    next(createError(500, 'Error marking notifications as read'));
  }
};

module.exports = {
  getMyNotifications,
  getAdminNotifications,
  getMyUnreadCount,
  getAdminUnreadCount,
  markNotificationAsRead,
  markAllMyNotificationsAsRead,
  markAllAdminNotificationsAsRead
};

