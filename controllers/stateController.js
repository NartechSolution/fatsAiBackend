const State = require('../models/state');
const prisma = require('../prisma/client');

exports.createState = async (req, res) => {
  try {
    const { countryId, name, code } = req.body;

    if (!countryId || !name || !code) {
      return res.status(400).json({
        success: false,
        message: 'countryId, name, and code are required',
      });
    }

    const country = await prisma.country.findUnique({
      where: { id: Number(countryId) },
    });
    if (!country) {
      return res.status(400).json({
        success: false,
        message: 'Country with provided ID does not exist',
      });
    }

    const state = await State.create({ countryId: Number(countryId), name, code });

    return res.status(201).json({
      success: true,
      message: 'State created successfully',
      data: state,
    });
  } catch (error) {
    console.error('Error creating state:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create state',
      error: error.message,
    });
  }
};

exports.getAllStates = async (req, res) => {
  try {
    const states = await State.findAll();
    return res.status(200).json({
      success: true,
      message: 'States retrieved successfully',
      data: states,
    });
  } catch (error) {
    console.error('Error retrieving states:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve states',
      error: error.message,
    });
  }
};

exports.getStatesByCountryId = async (req, res) => {
  try {
    const { countryId } = req.params;
    const states = await State.findByCountryId(countryId);
    return res.status(200).json({
      success: true,
      message: 'States retrieved successfully',
      data: states,
    });
  } catch (error) {
    console.error('Error retrieving states by country:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve states',
      error: error.message,
    });
  }
};

exports.getStateById = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findById(id);

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'State retrieved successfully',
      data: state,
    });
  } catch (error) {
    console.error('Error retrieving state:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve state',
      error: error.message,
    });
  }
};

exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { countryId, name, code } = req.body;

    const existing = await State.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
      });
    }

    if (countryId !== undefined) {
      const country = await prisma.country.findUnique({
        where: { id: Number(countryId) },
      });
      if (!country) {
        return res.status(400).json({
          success: false,
          message: 'Country with provided ID does not exist',
        });
      }
    }

    const state = await State.update(id, {
      ...(countryId !== undefined ? { countryId } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(code !== undefined ? { code } : {}),
    });

    return res.status(200).json({
      success: true,
      message: 'State updated successfully',
      data: state,
    });
  } catch (error) {
    console.error('Error updating state:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update state',
      error: error.message,
    });
  }
};

exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await State.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
      });
    }

    await State.delete(id);

    return res.status(200).json({
      success: true,
      message: 'State deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting state:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete state',
      error: error.message,
    });
  }
};
