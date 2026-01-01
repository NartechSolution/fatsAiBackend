const prisma = require('../prisma/client');

class DataManagement {
    // Create
    static async create(data) {
        return await prisma.dataManagement.create({
            data
        });
    }

    // Find all
    static async findAll() {
        return await prisma.dataManagement.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    // Find by ID
    static async findById(id) {
        return await prisma.dataManagement.findUnique({
            where: { id: parseInt(id) }
        });
    }

    // Update
    static async update(id, data) {
        return await prisma.dataManagement.update({
            where: { id: parseInt(id) },
            data
        });
    }

    // Delete
    static async delete(id) {
        return await prisma.dataManagement.delete({
            where: { id: parseInt(id) }
        });
    }
}

module.exports = DataManagement;
