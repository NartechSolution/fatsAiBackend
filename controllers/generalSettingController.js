const generalSettingModel = require('../models/generalSetting');
const { createError } = require('../utils/createError');
const { logActivity } = require('../utils/auditLogger');

// Get all GeneralSettings
const getAllGeneralSettings = async (req, res, next) => {
  try {
    const generalSettings = await generalSettingModel.getAllGeneralSettings();

    res.status(200).json({
      success: true,
      data: generalSettings
    });
  } catch (error) {
    next(createError(500, 'Error retrieving general settings'));
  }
};

// Get GeneralSetting by ID
const getGeneralSettingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const generalSetting = await generalSettingModel.getGeneralSettingById(id);

    if (!generalSetting) {
      return next(createError(404, 'General setting not found'));
    }

    res.status(200).json({
      success: true,
      data: generalSetting
    });
  } catch (error) {
    next(createError(500, 'Error retrieving general setting'));
  }
};

// Create new GeneralSetting
const createGeneralSetting = async (req, res, next) => {
  try {
    const {
      systemName,
      organizationName,
      contactEmail,
      contactPhone,
      landingPage,
      systemDescription,
      showBrandName,
      themes,
      timeZone,
      dateFormat,
      currencyFormat,
      status
    } = req.body;

    // Validate themes enum if provided
    if (themes && !['light', 'dark', 'auto'].includes(themes)) {
      return next(createError(400, 'Themes must be one of: light, dark, auto'));
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
    const generalSettingData = {
      systemName,
      organizationName,
      contactEmail,
      contactPhone,
      landingPage,
      systemDescription,
      showBrandName: convertToBoolean(showBrandName),
      themes,
      timeZone,
      dateFormat,
      currencyFormat,
      status
    };

    const newGeneralSetting = await generalSettingModel.createGeneralSetting(generalSettingData);

    res.status(201).json({
      success: true,
      data: newGeneralSetting
    });
  } catch (error) {
    console.error('Error creating general setting:', error);
    next(createError(500, `Error creating general setting: ${error.message}`));
  }
};

// Update GeneralSetting
const updateGeneralSetting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      systemName,
      organizationName,
      contactEmail,
      contactPhone,
      landingPage,
      systemDescription,
      showBrandName,
      themes,
      timeZone,
      dateFormat,
      currencyFormat,
      status
    } = req.body;

    // Check if GeneralSetting exists
    const existingGeneralSetting = await generalSettingModel.getGeneralSettingById(id);
    if (!existingGeneralSetting) {
      return next(createError(404, 'General setting not found'));
    }

    // Validate themes enum if provided
    if (themes && !['light', 'dark', 'auto'].includes(themes)) {
      return next(createError(400, 'Themes must be one of: light, dark, auto'));
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
    const generalSettingData = {
      systemName,
      organizationName,
      contactEmail,
      contactPhone,
      landingPage,
      systemDescription,
      showBrandName: showBrandName !== undefined ? convertToBoolean(showBrandName) : undefined,
      themes,
      timeZone,
      dateFormat,
      currencyFormat,
      status
    };

    const updatedGeneralSetting = await generalSettingModel.updateGeneralSetting(id, generalSettingData);

    // Log the setting update
    // Note: In a real app we might get the user ID from req.user if authenticated
    // For now we'll put "Admin" or similar if we don't have req.user, or check if it's available.
    const userId = req.user ? req.user.userId : 'System';
    const userName = req.user ? req.user.username : 'Admin';

    logActivity('Settings Updated', userId, userName, 'Success', `General settings updated for system: ${systemName || 'Unknown'}`);

    res.status(200).json({
      success: true,
      data: updatedGeneralSetting
    });
  } catch (error) {
    console.error('Error updating general setting:', error);
    next(createError(500, `Error updating general setting: ${error.message}`));
  }
};

// Delete GeneralSetting
const deleteGeneralSetting = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if GeneralSetting exists
    const existingGeneralSetting = await generalSettingModel.getGeneralSettingById(id);
    if (!existingGeneralSetting) {
      return next(createError(404, 'General setting not found'));
    }

    // Delete the GeneralSetting
    await generalSettingModel.deleteGeneralSetting(id);

    res.status(200).json({
      success: true,
      message: 'General setting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting general setting:', error);
    next(createError(500, `Error deleting general setting: ${error.message}`));
  }
};

module.exports = {
  getAllGeneralSettings,
  getGeneralSettingById,
  createGeneralSetting,
  updateGeneralSetting,
  deleteGeneralSetting
};

