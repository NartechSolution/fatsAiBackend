const AuditLog = require('../models/auditLog');
const AuditLogSetting = require('../models/auditLogSetting');

/**
 * Logs an activity to the audit log if logging is enabled.
 * 
 * @param {string} activity - The name of the activity (e.g., "User Login")
 * @param {string} userId - The ID of the user performing the action
 * @param {string} userName - The name of the user
 * @param {string} status - The status of the action (e.g., "Success", "Failed")
 * @param {string} details - Optional details about the action
 */
const logActivity = async (activity, userId, userName, status, details = null) => {
    try {
        // 1. Check if logging is enabled
        const settings = await AuditLogSetting.getSettings();
        if (!settings || !settings.enableAuditLogging) {
            return; // Logging disabled, do nothing
        }

        // 2. Create the log entry
        await AuditLog.create({
            activity,
            userId: userId ? String(userId) : null,
            userName,
            status,
            details
        });

    } catch (error) {
        // Fail silently so we don't block the main application flow
        console.error('Audit Logger Error:', error.message);
    }
};

module.exports = { logActivity };
