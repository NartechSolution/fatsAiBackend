const prisma = require('../prisma/client');

class City {
  // Create a new city with related departments and optional state
  static async create(data) {
    const { departmentIds = [], stateId, ...cityData } = data;

    return prisma.city.create({
      data: {
        ...cityData,
        ...(stateId != null ? { stateId: Number(stateId) } : {}),
        departments: departmentIds.length
          ? {
              connect: departmentIds.map((id) => ({ id: Number(id) })),
            }
          : undefined,
      },
      include: {
        departments: true,
        state: { include: { country: true } },
      },
    });
  }

  // Get all cities with their departments and state
  static async findAll() {
    return prisma.city.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        departments: true,
        state: { include: { country: true } },
      },
    });
  }

  // Get city by ID
  static async findById(id) {
    return prisma.city.findUnique({
      where: { id: Number(id) },
      include: {
        departments: true,
        state: { include: { country: true } },
      },
    });
  }

  // Update city and its departments and optional state
  static async update(id, data) {
    const { departmentIds, stateId, ...cityData } = data;

    return prisma.city.update({
      where: { id: Number(id) },
      data: {
        ...cityData,
        ...(stateId !== undefined ? { stateId: stateId == null ? null : Number(stateId) } : {}),
        ...(Array.isArray(departmentIds)
          ? {
              departments: {
                set: departmentIds.map((depId) => ({ id: Number(depId) })),
              },
            }
          : {}),
      },
      include: {
        departments: true,
        state: { include: { country: true } },
      },
    });
  }

  // Delete city
  static async delete(id) {
    return prisma.city.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = City;


