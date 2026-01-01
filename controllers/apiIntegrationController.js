const apiIntegrationModel = require('../models/apiIntegration');
const { createError } = require('../utils/createError');

// Get all ApiIntegrations
const getAllApiIntegrations = async (req, res, next) => {
  try {
    const apiIntegrations = await apiIntegrationModel.getAllApiIntegrations();
    
    res.status(200).json({
      success: true,
      data: apiIntegrations
    });
  } catch (error) {
    next(createError(500, 'Error retrieving API integrations'));
  }
};

// Get ApiIntegration by ID
const getApiIntegrationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const apiIntegration = await apiIntegrationModel.getApiIntegrationById(id);
    
    if (!apiIntegration) {
      return next(createError(404, 'API integration not found'));
    }
    
    res.status(200).json({
      success: true,
      data: apiIntegration
    });
  } catch (error) {
    next(createError(500, 'Error retrieving API integration'));
  }
};

// Create new ApiIntegration
const createApiIntegration = async (req, res, next) => {
  try {
    const { 
      apiKey,
      googleMapIntegration,
      cloudStorage,
      emailService
    } = req.body;
    
    // Validate required fields
    if (!apiKey) {
      return next(createError(400, 'API key is required'));
    }
    
    // Convert boolean strings to booleans
    const convertToBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    // Prepare data for database
    const apiIntegrationData = {
      apiKey: apiKey,
      googleMapIntegration: convertToBoolean(googleMapIntegration),
      cloudStorage: convertToBoolean(cloudStorage),
      emailService: convertToBoolean(emailService),
    };
    
    const newApiIntegration = await apiIntegrationModel.createApiIntegration(apiIntegrationData);
    
    res.status(201).json({
      success: true,
      data: newApiIntegration
    });
  } catch (error) {
    console.error('Error creating API integration:', error);
    next(createError(500, `Error creating API integration: ${error.message}`));
  }
};

// Update ApiIntegration
const updateApiIntegration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      apiKey,
      googleMapIntegration,
      cloudStorage,
      emailService
    } = req.body;
    
    // Check if ApiIntegration exists
    const existingApiIntegration = await apiIntegrationModel.getApiIntegrationById(id);
    if (!existingApiIntegration) {
      return next(createError(404, 'API integration not found'));
    }
    
    // Convert boolean strings to booleans
    const convertToBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    // Prepare data for database
    const apiIntegrationData = {
      apiKey: apiKey !== undefined ? apiKey : undefined,
      googleMapIntegration: googleMapIntegration !== undefined ? convertToBoolean(googleMapIntegration) : undefined,
      cloudStorage: cloudStorage !== undefined ? convertToBoolean(cloudStorage) : undefined,
      emailService: emailService !== undefined ? convertToBoolean(emailService) : undefined,
    };
    
    const updatedApiIntegration = await apiIntegrationModel.updateApiIntegration(id, apiIntegrationData);
    
    res.status(200).json({
      success: true,
      data: updatedApiIntegration
    });
  } catch (error) {
    console.error('Error updating API integration:', error);
    next(createError(500, `Error updating API integration: ${error.message}`));
  }
};

// Delete ApiIntegration
const deleteApiIntegration = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if ApiIntegration exists
    const existingApiIntegration = await apiIntegrationModel.getApiIntegrationById(id);
    if (!existingApiIntegration) {
      return next(createError(404, 'API integration not found'));
    }
    
    // Delete the ApiIntegration
    await apiIntegrationModel.deleteApiIntegration(id);
    
    res.status(200).json({
      success: true,
      message: 'API integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API integration:', error);
    next(createError(500, `Error deleting API integration: ${error.message}`));
  }
};

module.exports = {
  getAllApiIntegrations,
  getApiIntegrationById,
  createApiIntegration,
  updateApiIntegration,
  deleteApiIntegration
};

