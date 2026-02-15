const City = require('../models/city');
const prisma = require('../prisma/client');

// Create a new city
exports.createCity = async (req, res) => {
  try {
    const {
      name,
      country,
      latitude,
      longitude,
      status,
      description,
      departmentIds,
      stateId,
    } = req.body;

    // Basic validation
    if (!name || !country || latitude === undefined || longitude === undefined || !status) {
      return res.status(400).json({
        success: false,
        message: 'name, country, latitude, longitude, and status are required',
      });
    }

    // Validate departmentIds if provided
    let validDepartmentIds = [];
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      const numericIds = departmentIds.map((id) => Number(id));
      const departments = await prisma.department.findMany({
        where: { id: { in: numericIds } },
        select: { id: true },
      });

      const foundIds = departments.map((d) => d.id);
      const missingIds = numericIds.filter((id) => !foundIds.includes(id));

      if (missingIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid department IDs: ${missingIds.join(', ')}`,
        });
      }

      validDepartmentIds = numericIds;
    }

    if (stateId != null) {
      const state = await prisma.state.findUnique({
        where: { id: Number(stateId) },
      });
      if (!state) {
        return res.status(400).json({
          success: false,
          message: `State with ID ${stateId} does not exist`,
        });
      }
    }

    const city = await City.create({
      name,
      country,
      latitude: Number(latitude),
      longitude: Number(longitude),
      status,
      description: description || null,
      departmentIds: validDepartmentIds,
      ...(stateId != null ? { stateId: Number(stateId) } : {}),
    });

    return res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: city,
    });
  } catch (error) {
    console.error('Error creating city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message,
    });
  }
};

// Get all cities
exports.getAllCities = async (req, res) => {
  try {
    const cities = await City.findAll();
    return res.status(200).json({
      success: true,
      message: 'Cities retrieved successfully',
      data: cities,
    });
  } catch (error) {
    console.error('Error retrieving cities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cities',
      error: error.message,
    });
  }
};

// Get city by ID
exports.getCityById = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findById(id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'City retrieved successfully',
      data: city,
    });
  } catch (error) {
    console.error('Error retrieving city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve city',
      error: error.message,
    });
  }
};

// Update city
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      country,
      latitude,
      longitude,
      status,
      description,
      departmentIds,
      stateId,
    } = req.body;

    // Check if city exists
    const existingCity = await City.findById(id);
    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    let validDepartmentIds;
    if (Array.isArray(departmentIds)) {
      const numericIds = departmentIds.map((depId) => Number(depId));
      const departments = await prisma.department.findMany({
        where: { id: { in: numericIds } },
        select: { id: true },
      });

      const foundIds = departments.map((d) => d.id);
      const missingIds = numericIds.filter((depId) => !foundIds.includes(depId));

      if (missingIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid department IDs: ${missingIds.join(', ')}`,
        });
      }

      validDepartmentIds = numericIds;
    }

    if (stateId !== undefined && stateId != null) {
      const state = await prisma.state.findUnique({
        where: { id: Number(stateId) },
      });
      if (!state) {
        return res.status(400).json({
          success: false,
          message: `State with ID ${stateId} does not exist`,
        });
      }
    }

    const city = await City.update(id, {
      ...(name !== undefined ? { name } : {}),
      ...(country !== undefined ? { country } : {}),
      ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
      ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(validDepartmentIds !== undefined ? { departmentIds: validDepartmentIds } : {}),
      ...(stateId !== undefined ? { stateId: stateId == null ? null : Number(stateId) } : {}),
    });

    return res.status(200).json({
      success: true,
      message: 'City updated successfully',
      data: city,
    });
  } catch (error) {
    console.error('Error updating city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error.message,
    });
  }
};

// Delete city
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCity = await City.findById(id);
    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
      });
    }

    await City.delete(id);

    return res.status(200).json({
      success: true,
      message: 'City deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error.message,
    });
  }
};


