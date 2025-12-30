const resourceModel = require('../models/resource');
const resourceCategoryModel = require('../models/resourceCategory');
const { uploadDocuments, getDocumentUrl } = require('../utils/uploadUtils');
const { createError } = require('../utils/createError');

// Middleware for handling file uploads
const uploadResourceFile = uploadDocuments.single('file');

// Get all Resources
const getAllResources = async (req, res, next) => {
  try {
    const resources = await resourceModel.getAllResources();
    
    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    next(createError(500, 'Error retrieving resources'));
  }
};

// Get Resource by ID
const getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resource = await resourceModel.getResourceById(id);
    
    if (!resource) {
      return next(createError(404, 'Resource not found'));
    }
    
    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    next(createError(500, 'Error retrieving resource'));
  }
};

// Get Resources by Category ID
const getResourcesByCategoryId = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const resources = await resourceModel.getResourcesByCategoryId(categoryId);
    
    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    next(createError(500, 'Error retrieving resources by category'));
  }
};

// Create new Resource
const createResource = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      ResourceCategoryId, 
      version, 
      Visibility, 
      expiredDate, 
      feature, 
      status 
    } = req.body;
    
    // Validate required fields
    if (!title || !ResourceCategoryId) {
      return next(createError(400, 'Title and ResourceCategoryId are required fields'));
    }
    
    // Check if ResourceCategory exists
    const resourceCategory = await resourceCategoryModel.getResourceCategoryById(ResourceCategoryId);
    if (!resourceCategory) {
      return next(createError(404, 'Resource category not found'));
    }
    
    // Process file if uploaded
    let filePath = null;
    if (req.file) {
      filePath = getDocumentUrl(req.file.filename);
    }
    
    // Prepare data for database
    const resourceData = {
      title,
      description,
      file: filePath,
      ResourceCategoryId,
      version,
      Visibility,
      expiredDate,
      feature,
      status
    };
    
    const newResource = await resourceModel.createResource(resourceData);
    
    res.status(201).json({
      success: true,
      data: newResource
    });
  } catch (error) {
    next(createError(500, 'Error creating resource'));
  }
};

// Update Resource
const updateResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      ResourceCategoryId, 
      version, 
      Visibility, 
      expiredDate, 
      feature, 
      status 
    } = req.body;
    
    // Check if Resource exists
    const existingResource = await resourceModel.getResourceById(id);
    if (!existingResource) {
      return next(createError(404, 'Resource not found'));
    }
    
    // Validate required fields if title is being updated
    if (title !== undefined && !title) {
      return next(createError(400, 'Title is required'));
    }
    
    // If ResourceCategoryId is provided, check if it exists
    if (ResourceCategoryId) {
      const resourceCategory = await resourceCategoryModel.getResourceCategoryById(ResourceCategoryId);
      if (!resourceCategory) {
        return next(createError(404, 'Resource category not found'));
      }
    }
    
    // Process file if uploaded
    let filePath = existingResource.file;
    if (req.file) {
      filePath = getDocumentUrl(req.file.filename);
    }
    
    // Prepare data for database
    const resourceData = {
      title: title !== undefined ? title : existingResource.title,
      description,
      file: filePath,
      ResourceCategoryId,
      version,
      Visibility,
      expiredDate,
      feature,
      status
    };
    
    const updatedResource = await resourceModel.updateResource(id, resourceData);
    
    res.status(200).json({
      success: true,
      data: updatedResource
    });
  } catch (error) {
    next(createError(500, 'Error updating resource'));
  }
};

// Delete Resource
const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if Resource exists
    const existingResource = await resourceModel.getResourceById(id);
    if (!existingResource) {
      return next(createError(404, 'Resource not found'));
    }
    
    // Delete the Resource
    await resourceModel.deleteResource(id);
    
    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    next(createError(500, 'Error deleting resource'));
  }
};

module.exports = {
  uploadResourceFile,
  getAllResources,
  getResourceById,
  getResourcesByCategoryId,
  createResource,
  updateResource,
  deleteResource
};

