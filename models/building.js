const prisma = require('../prisma/client');

class Building {
  // Create a new building
  static async create(data) {
    const { cityId, ...buildingData } = data;
    
    return prisma.building.create({
      data: {
        ...buildingData,
        ...(cityId != null ? { cityId: Number(cityId) } : {}),
      },
      include: {
        city: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });
  }

  // Get all buildings
  static async findAll() {
    return prisma.building.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        city: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });
  }

  // Get buildings by city ID
  static async findByCityId(cityId) {
    return prisma.building.findMany({
      where: { cityId: Number(cityId) },
      orderBy: { createdAt: 'desc' },
      include: {
        city: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });
  }

  // Get building by ID
  static async findById(id) {
    return prisma.building.findUnique({
      where: { id: Number(id) },
      include: {
        city: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
        floors: true,
      },
    });
  }

  // Update building
  static async update(id, data) {
    const { cityId, ...buildingData } = data;
    
    return prisma.building.update({
      where: { id: Number(id) },
      data: {
        ...buildingData,
        ...(cityId !== undefined ? { cityId: cityId == null ? null : Number(cityId) } : {}),
      },
      include: {
        city: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });
  }

  // Delete building
  static async delete(id) {
    return prisma.building.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = Building;


