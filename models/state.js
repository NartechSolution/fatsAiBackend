const prisma = require('../prisma/client');

class State {
  static async create(data) {
    return prisma.state.create({
      data: {
        ...data,
        countryId: Number(data.countryId),
      },
      include: {
        country: true,
        cities: true,
      },
    });
  }

  static async findAll() {
    return prisma.state.findMany({
      orderBy: { name: 'asc' },
      include: {
        country: true,
        cities: true,
      },
    });
  }

  static async findById(id) {
    return prisma.state.findUnique({
      where: { id: Number(id) },
      include: {
        country: true,
        cities: true,
      },
    });
  }

  static async findByCountryId(countryId) {
    return prisma.state.findMany({
      where: { countryId: Number(countryId) },
      orderBy: { name: 'asc' },
      include: {
        country: true,
        cities: true,
      },
    });
  }

  static async update(id, data) {
    const { countryId, ...rest } = data;
    return prisma.state.update({
      where: { id: Number(id) },
      data: {
        ...rest,
        ...(countryId !== undefined ? { countryId: Number(countryId) } : {}),
      },
      include: {
        country: true,
        cities: true,
      },
    });
  }

  static async delete(id) {
    return prisma.state.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = State;
