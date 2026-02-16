const Floor = require('../models/floor');
const prisma = require('../prisma/client');

exports.createFloor = async (req, res) => {
  try {
    const { nameOrNumber, buildingId } = req.body;

    if (!nameOrNumber) {
      return res.status(400).json({
        success: false,
        message: 'nameOrNumber is required',
      });
    }

    // Validate buildingId if provided
    if (buildingId != null) {
      const building = await prisma.building.findUnique({
        where: { id: Number(buildingId) },
      });
      if (!building) {
        return res.status(400).json({
          success: false,
          message: 'Building with provided ID does not exist',
        });
      }
    }

    const floor = await Floor.create({ nameOrNumber, buildingId });

    return res.status(201).json({
      success: true,
      message: 'Floor created successfully',
      data: floor,
    });
  } catch (error) {
    console.error('Error creating floor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create floor',
      error: error.message,
    });
  }
};

exports.getAllFloors = async (req, res) => {
  try {
    const floors = await Floor.findAll();
    return res.status(200).json({
      success: true,
      message: 'Floors retrieved successfully',
      data: floors,
    });
  } catch (error) {
    console.error('Error retrieving floors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve floors',
      error: error.message,
    });
  }
};

exports.getFloorsByBuildingId = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const floors = await Floor.findByBuildingId(buildingId);
    return res.status(200).json({
      success: true,
      message: 'Floors retrieved successfully',
      data: floors,
    });
  } catch (error) {
    console.error('Error retrieving floors by building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve floors',
      error: error.message,
    });
  }
};

exports.getFloorById = async (req, res) => {
  try {
    const { id } = req.params;
    const floor = await Floor.findById(id);

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Floor retrieved successfully',
      data: floor,
    });
  } catch (error) {
    console.error('Error retrieving floor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve floor',
      error: error.message,
    });
  }
};

exports.updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameOrNumber, buildingId } = req.body;

    const existing = await Floor.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found',
      });
    }

    // Validate buildingId if provided
    if (buildingId !== undefined && buildingId != null) {
      const building = await prisma.building.findUnique({
        where: { id: Number(buildingId) },
      });
      if (!building) {
        return res.status(400).json({
          success: false,
          message: 'Building with provided ID does not exist',
        });
      }
    }

    const floor = await Floor.update(id, {
      ...(nameOrNumber !== undefined ? { nameOrNumber } : {}),
      ...(buildingId !== undefined ? { buildingId } : {}),
    });

    return res.status(200).json({
      success: true,
      message: 'Floor updated successfully',
      data: floor,
    });
  } catch (error) {
    console.error('Error updating floor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update floor',
      error: error.message,
    });
  }
};

exports.deleteFloor = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Floor.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found',
      });
    }

    await Floor.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Floor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting floor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete floor',
      error: error.message,
    });
  }
};


