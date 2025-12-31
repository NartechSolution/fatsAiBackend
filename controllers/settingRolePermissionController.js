const settingRolePermissionModel = require('../models/settingRolePermission');
const { createError } = require('../utils/createError');

// Get all SettingRolePermissions
const getAllSettingRolePermissions = async (req, res, next) => {
  try {
    const settingRolePermissions = await settingRolePermissionModel.getAllSettingRolePermissions();
    
    res.status(200).json({
      success: true,
      data: settingRolePermissions
    });
  } catch (error) {
    next(createError(500, 'Error retrieving setting role permissions'));
  }
};

// Get SettingRolePermission by ID
const getSettingRolePermissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const settingRolePermission = await settingRolePermissionModel.getSettingRolePermissionById(id);
    
    if (!settingRolePermission) {
      return next(createError(404, 'Setting role permission not found'));
    }
    
    res.status(200).json({
      success: true,
      data: settingRolePermission
    });
  } catch (error) {
    next(createError(500, 'Error retrieving setting role permission'));
  }
};

// Create new SettingRolePermission
const createSettingRolePermission = async (req, res, next) => {
  try {
    const { 
      roleForNewUsers,
      allowRoleEditor,
      allowDeparmentCreation
    } = req.body;
    
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
    const settingRolePermissionData = {
      roleForNewUsers,
      allowRoleEditor: convertToBoolean(allowRoleEditor),
      allowDeparmentCreation: convertToBoolean(allowDeparmentCreation),
    };
    
    const newSettingRolePermission = await settingRolePermissionModel.createSettingRolePermission(settingRolePermissionData);
    
    res.status(201).json({
      success: true,
      data: newSettingRolePermission
    });
  } catch (error) {
    console.error('Error creating setting role permission:', error);
    next(createError(500, `Error creating setting role permission: ${error.message}`));
  }
};

// Update SettingRolePermission
const updateSettingRolePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      roleForNewUsers,
      allowRoleEditor,
      allowDeparmentCreation
    } = req.body;
    
    // Check if SettingRolePermission exists
    const existingSettingRolePermission = await settingRolePermissionModel.getSettingRolePermissionById(id);
    if (!existingSettingRolePermission) {
      return next(createError(404, 'Setting role permission not found'));
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
    const settingRolePermissionData = {
      roleForNewUsers,
      allowRoleEditor: allowRoleEditor !== undefined ? convertToBoolean(allowRoleEditor) : undefined,
      allowDeparmentCreation: allowDeparmentCreation !== undefined ? convertToBoolean(allowDeparmentCreation) : undefined,
    };
    
    const updatedSettingRolePermission = await settingRolePermissionModel.updateSettingRolePermission(id, settingRolePermissionData);
    
    res.status(200).json({
      success: true,
      data: updatedSettingRolePermission
    });
  } catch (error) {
    console.error('Error updating setting role permission:', error);
    next(createError(500, `Error updating setting role permission: ${error.message}`));
  }
};

// Delete SettingRolePermission
const deleteSettingRolePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if SettingRolePermission exists
    const existingSettingRolePermission = await settingRolePermissionModel.getSettingRolePermissionById(id);
    if (!existingSettingRolePermission) {
      return next(createError(404, 'Setting role permission not found'));
    }
    
    // Delete the SettingRolePermission
    await settingRolePermissionModel.deleteSettingRolePermission(id);
    
    res.status(200).json({
      success: true,
      message: 'Setting role permission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting setting role permission:', error);
    next(createError(500, `Error deleting setting role permission: ${error.message}`));
  }
};

module.exports = {
  getAllSettingRolePermissions,
  getSettingRolePermissionById,
  createSettingRolePermission,
  updateSettingRolePermission,
  deleteSettingRolePermission
};

