const AuditLog = require('../models/auditLog');
const AuditLogSetting = require('../models/auditLogSetting');

// Get all logs
exports.getLogs = async (req, res) => {
    try {
        const logs = await AuditLog.findAll();
        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Get Audit Logs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit logs',
            error: error.message
        });
    }
};

// Create a log (internal use or manual)
exports.createLog = async (req, res) => {
    try {
        const { activity, userId, userName, status, details } = req.body;

        // Check if logging is enabled
        const settings = await AuditLogSetting.getSettings();
        if (!settings.enableAuditLogging) {
            return res.status(200).json({
                success: true,
                message: 'Audit logging is disabled',
                data: null
            });
        }

        const newLog = await AuditLog.create({
            activity,
            userId,
            userName,
            status,
            details
        });

        res.status(201).json({
            success: true,
            data: newLog
        });
    } catch (error) {
        console.error('Create Audit Log Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create audit log',
            error: error.message
        });
    }
};

// Get settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await AuditLogSetting.getSettings();
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get Audit Log Settings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve settings',
            error: error.message
        });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        const { enableAuditLogging, logLevel } = req.body;

        const updatedSettings = await AuditLogSetting.updateSettings({
            enableAuditLogging,
            logLevel
        });

        res.status(200).json({
            success: true,
            data: updatedSettings
        });
    } catch (error) {
        console.error('Update Audit Log Settings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
};
