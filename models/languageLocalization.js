const prisma = require('../prisma/client');

class LanguageLocalization {
    // Create
    static async create(data) {
        return await prisma.languageLocalization.create({
            data
        });
    }

    // Find all
    static async findAll() {
        return await prisma.languageLocalization.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    // Find by ID
    static async findById(id) {
        return await prisma.languageLocalization.findUnique({
            where: { id: parseInt(id) }
        });
    }

    // Update
    static async update(id, data) {
        return await prisma.languageLocalization.update({
            where: { id: parseInt(id) },
            data
        });
    }

    // Delete
    static async delete(id) {
        return await prisma.languageLocalization.delete({
            where: { id: parseInt(id) }
        });
    }
}

module.exports = LanguageLocalization;
