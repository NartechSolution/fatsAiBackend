const Building = require('../models/building');
const prisma = require('../prisma/client');

exports.createBuilding = async (req, res) => {
  try {
    const { name, address, number, cityId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required',
      });
    }

    // Validate cityId if provided
    if (cityId != null) {
      const city = await prisma.city.findUnique({
        where: { id: Number(cityId) },
      });
      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City with provided ID does not exist',
        });
      }
    }

    const building = await Building.create({ name, address, number, cityId });

    return res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: building,
    });
  } catch (error) {
    console.error('Error creating building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create building',
      error: error.message,
    });
  }
};

exports.getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.findAll();
    return res.status(200).json({
      success: true,
      message: 'Buildings retrieved successfully',
      data: buildings,
    });
  } catch (error) {
    console.error('Error retrieving buildings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve buildings',
      error: error.message,
    });
  }
};

exports.getBuildingsByCityId = async (req, res) => {
  try {
    const { cityId } = req.params;
    const buildings = await Building.findByCityId(cityId);
    return res.status(200).json({
      success: true,
      message: 'Buildings retrieved successfully',
      data: buildings,
    });
  } catch (error) {
    console.error('Error retrieving buildings by city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve buildings',
      error: error.message,
    });
  }
};

exports.getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;
    const building = await Building.findById(id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Building retrieved successfully',
      data: building,
    });
  } catch (error) {
    console.error('Error retrieving building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve building',
      error: error.message,
    });
  }
};

exports.updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, number, cityId } = req.body;

    const existing = await Building.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    // Validate cityId if provided
    if (cityId !== undefined && cityId != null) {
      const city = await prisma.city.findUnique({
        where: { id: Number(cityId) },
      });
      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City with provided ID does not exist',
        });
      }
    }

    const building = await Building.update(id, {
      ...(name !== undefined ? { name } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(number !== undefined ? { number } : {}),
      ...(cityId !== undefined ? { cityId } : {}),
    });

    return res.status(200).json({
      success: true,
      message: 'Building updated successfully',
      data: building,
    });
  } catch (error) {
    console.error('Error updating building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update building',
      error: error.message,
    });
  }
};

exports.deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Building.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    await Building.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Building deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete building',
      error: error.message,
    });
  }
};


