const { logActivity } = require('../utils/auditLogger');

const auditLogMiddleware = (req, res, next) => {
    // Store original end function to intercept response
    res.on('finish', async () => {
        try {
            // Filter out paths we don't want to log (like the log viewer itself or static files)
            if (req.originalUrl.includes('/api/audit-logs') ||
                req.originalUrl.startsWith('/uploads') ||
                req.method === 'OPTIONS') {
                return;
            }

            const userId = req.user ? req.user.userId : null;
            const userName = req.user ? req.user.username : ((req.body && req.body.email) || 'Guest');
            const activity = `${req.method} ${req.originalUrl}`;
            const status = res.statusCode >= 400 ? 'Failed' : 'Success';
            const details = `Status Code: ${res.statusCode} - IP: ${req.ip}`;

            // Call the logger (fire and forget)
            await logActivity(activity, userId, userName, status, details);
        } catch (error) {
            console.error('Audit Middleware Error:', error);
        }
    });

    next();
};

module.exports = auditLogMiddleware;
