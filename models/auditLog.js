const prisma = require('../prisma/client');

class AuditLog {
    // Create
    static async create(data) {
        return await prisma.auditLog.create({
            data
        });
    }

    // Find all (with optional limit)
    static async findAll(limit = 100) {
        return await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: limit
        });
    }

    // Find by ID
    static async findById(id) {
        return await prisma.auditLog.findUnique({
            where: { id: parseInt(id) }
        });
    }
}

module.exports = AuditLog;
