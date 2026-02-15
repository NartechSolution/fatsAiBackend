const prisma = require('../prisma/client');

class Country {
  static async create(data) {
    return prisma.country.create({
      data,
    });
  }

  static async findAll() {
    return prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        states: true,
      },
    });
  }

  static async findById(id) {
    return prisma.country.findUnique({
      where: { id: Number(id) },
      include: {
        states: true,
      },
    });
  }

  static async update(id, data) {
    return prisma.country.update({
      where: { id: Number(id) },
      data,
    });
  }

  static async delete(id) {
    return prisma.country.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = Country;
