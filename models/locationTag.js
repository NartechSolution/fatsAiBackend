const prisma = require('../prisma/client');

class LocationTag {
  // Create a new location tag
  static async create(locationTagData) {
    return prisma.locationTag.create({
      data: locationTagData
    });
  }

  // Get all location tags
  static async getAll() {
    return prisma.locationTag.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Get location tag by ID
  static async getById(id) {
    return prisma.locationTag.findUnique({
      where: { id: parseInt(id) }
    });
  }

  // Get location tag by location code
  static async getByCode(locationCode) {
    return prisma.locationTag.findUnique({
      where: { locationCode }
    });
  }

  // Update location tag
  static async update(id, locationTagData) {
    return prisma.locationTag.update({
      where: { id: parseInt(id) },
      data: locationTagData
    });
  }

  // Delete location tag
  static async delete(id) {
    return prisma.locationTag.delete({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = LocationTag;
