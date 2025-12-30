const resourceCategoryModel = require('../models/resourceCategory');
const {createError} = require('../utils/createError');

// Get all ResourceCategories
const getAllResourceCategories = async (req, res, next) => {
  try {
    const resourceCategories = await resourceCategoryModel.getAllResourceCategories();
    
    res.status(200).json({
      success: true,
      data: resourceCategories
    });
  } catch (error) {
    next(createError(500, 'Error retrieving resource categories'));
  }
};

// Get ResourceCategory by ID
const getResourceCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resourceCategory = await resourceCategoryModel.getResourceCategoryById(id);
    
    if (!resourceCategory) {
      return next(createError(404, 'Resource category not found'));
    }
    
    res.status(200).json({
      success: true,
      data: resourceCategory
    });
  } catch (error) {
    next(createError(500, 'Error retrieving resource category'));
  }
};

// Create new ResourceCategory
const createResourceCategory = async (req, res, next) => {
  try {
    const { name, name_ar, name_filo, status } = req.body;
    
    // Validate required fields
    if (!name || !name_ar) {
      return next(createError(400, 'Name and name_ar are required fields'));
    }
    
    // Prepare data for database
    const resourceCategoryData = {
      name,
      name_ar,
      name_filo,
      status
    };
    
    const newResourceCategory = await resourceCategoryModel.createResourceCategory(resourceCategoryData);
    
    res.status(201).json({
      success: true,
      data: newResourceCategory
    });
  } catch (error) {
    next(createError(500, 'Error creating resource category'));
  }
};

// Update ResourceCategory
const updateResourceCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, name_ar, name_filo, status } = req.body;
    
    // Check if ResourceCategory exists
    const existingResourceCategory = await resourceCategoryModel.getResourceCategoryById(id);
    if (!existingResourceCategory) {
      return next(createError(404, 'Resource category not found'));
    }
    
    // Validate required fields
    if (!name || !name_ar) {
      return next(createError(400, 'Name and name_ar are required fields'));
    }
    
    // Prepare data for database
    const resourceCategoryData = {
      name,
      name_ar,
      name_filo,
      status
    };
    
    const updatedResourceCategory = await resourceCategoryModel.updateResourceCategory(id, resourceCategoryData);
    
    res.status(200).json({
      success: true,
      data: updatedResourceCategory
    });
  } catch (error) {
    next(createError(500, 'Error updating resource category'));
  }
};

// Delete ResourceCategory
const deleteResourceCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if ResourceCategory exists
    const existingResourceCategory = await resourceCategoryModel.getResourceCategoryById(id);
    if (!existingResourceCategory) {
      return next(createError(404, 'Resource category not found'));
    }
    
    // Delete the ResourceCategory
    await resourceCategoryModel.deleteResourceCategory(id);
    
    res.status(200).json({
      success: true,
      message: 'Resource category deleted successfully'
    });
  } catch (error) {
    next(createError(500, 'Error deleting resource category'));
  }
};

module.exports = {
  getAllResourceCategories,
  getResourceCategoryById,
  createResourceCategory,
  updateResourceCategory,
  deleteResourceCategory
};

