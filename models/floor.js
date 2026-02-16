const prisma = require('../prisma/client');

class Floor {
  // Create a new floor
  static async create(data) {
    const { buildingId, ...floorData } = data;
    
    return prisma.floor.create({
      data: {
        ...floorData,
        ...(buildingId != null ? { buildingId: Number(buildingId) } : {}),
      },
      include: {
        building: {
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
        },
      },
    });
  }

  // Get all floors
  static async findAll() {
    return prisma.floor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        building: {
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
        },
      },
    });
  }

  // Get floors by building ID
  static async findByBuildingId(buildingId) {
    return prisma.floor.findMany({
      where: { buildingId: Number(buildingId) },
      orderBy: { nameOrNumber: 'asc' },
      include: {
        building: {
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
        },
      },
    });
  }

  // Get floor by ID
  static async findById(id) {
    return prisma.floor.findUnique({
      where: { id: Number(id) },
      include: {
        building: {
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
        },
      },
    });
  }

  // Update floor
  static async update(id, data) {
    const { buildingId, ...floorData } = data;
    
    return prisma.floor.update({
      where: { id: Number(id) },
      data: {
        ...floorData,
        ...(buildingId !== undefined ? { buildingId: buildingId == null ? null : Number(buildingId) } : {}),
      },
      include: {
        building: {
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
        },
      },
    });
  }

  // Delete floor
  static async delete(id) {
    return prisma.floor.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = Floor;


