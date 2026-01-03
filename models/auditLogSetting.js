const prisma = require('../prisma/client');

class AuditLogSetting {
    // Get settings (should be singleton-like)
    static async getSettings() {
        let settings = await prisma.auditLogSetting.findFirst();
        if (!settings) {
            settings = await prisma.auditLogSetting.create({
                data: {
                    enableAuditLogging: true,
                    logLevel: 'All Activities'
                }
            });
        }
        return settings;
    }

    // Update settings
    static async updateSettings(data) {
        const settings = await this.getSettings();
        return await prisma.auditLogSetting.update({
            where: { id: settings.id },
            data
        });
    }
}

module.exports = AuditLogSetting;
