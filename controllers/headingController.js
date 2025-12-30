const headingModel = require('../models/heading');
const {createError} = require('../utils/createError');

// Get all Headings
const getAllHeadings = async (req, res, next) => {
  try {
    const headings = await headingModel.getAllHeadings();
    
    res.status(200).json({
      success: true,
      data: headings
    });
  } catch (error) {
    next(createError(500, 'Error retrieving headings'));
  }
};

// Get Heading by ID
const getHeadingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const heading = await headingModel.getHeadingById(id);
    
    if (!heading) {
      return next(createError(404, 'Heading not found'));
    }
    
    res.status(200).json({
      success: true,
      data: heading
    });
  } catch (error) {
    next(createError(500, 'Error retrieving heading'));
  }
};

// Create new Heading
const createHeading = async (req, res, next) => {
  try {
    const { 
      name, 
      name_ar, 
      caption, 
      caption_ar,
      HTMLTag,
      Description,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight,
      letterSpacing,
      textTransform,
      textColor,
      textAlignment,
      exampleText,
      textShadow,
      Visibility,
      name_filo,
      caption_flo
    } = req.body;
    
    // Validate required fields
    if (!name || !name_ar) {
      return next(createError(400, 'Name and name_ar are required fields'));
    }
    
    // Prepare data for database
    const headingData = {
      name,
      name_ar,
      caption,
      caption_ar,
      HTMLTag,
      Description,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight,
      letterSpacing,
      textTransform,
      textColor,
      textAlignment,
      exampleText,
      textShadow,
      Visibility,
      name_filo,
      caption_flo
    };
    
    const newHeading = await headingModel.createHeading(headingData);
    
    res.status(201).json({
      success: true,
      data: newHeading
    });
  } catch (error) {
    next(createError(500, 'Error creating heading'));
  }
};

// Update Heading
const updateHeading = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      name_ar, 
      caption, 
      caption_ar,
      HTMLTag,
      Description,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight,
      letterSpacing,
      textTransform,
      textColor,
      textAlignment,
      exampleText,
      textShadow,
      Visibility,
      name_filo,
      caption_flo
    } = req.body;
    
    // Check if Heading exists
    const existingHeading = await headingModel.getHeadingById(id);
    if (!existingHeading) {
      return next(createError(404, 'Heading not found'));
    }
    
    // Validate required fields
    if (!name || !name_ar) {
      return next(createError(400, 'Name and name_ar are required fields'));
    }
    
    // Prepare data for database
    const headingData = {
      name,
      name_ar,
      caption,
      caption_ar,
      HTMLTag,
      Description,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight,
      letterSpacing,
      textTransform,
      textColor,
      textAlignment,
      exampleText,
      textShadow,
      Visibility,
      name_filo,
      caption_flo
    };
    
    const updatedHeading = await headingModel.updateHeading(id, headingData);
    
    res.status(200).json({
      success: true,
      data: updatedHeading
    });
  } catch (error) {
    next(createError(500, 'Error updating heading'));
  }
};

// Delete Heading
const deleteHeading = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if Heading exists
    const existingHeading = await headingModel.getHeadingById(id);
    if (!existingHeading) {
      return next(createError(404, 'Heading not found'));
    }
    
    // Delete the Heading
    await headingModel.deleteHeading(id);
    
    res.status(200).json({
      success: true,
      message: 'Heading deleted successfully'
    });
  } catch (error) {
    next(createError(500, 'Error deleting heading'));
  }
};

module.exports = {
  getAllHeadings,
  getHeadingById,
  createHeading,
  updateHeading,
  deleteHeading
};
