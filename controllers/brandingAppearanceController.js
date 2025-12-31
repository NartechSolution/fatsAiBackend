const brandingAppearanceModel = require('../models/brandingAppearance');
const { upload, getImageUrl } = require('../utils/uploadUtils');
const fs = require('fs');
const { createError } = require('../utils/createError');

// Handle file upload with multer middleware
const uploadLogo = upload.single('logo');

// Get all BrandingAppearances
const getAllBrandingAppearances = async (req, res, next) => {
  try {
    const brandingAppearances = await brandingAppearanceModel.getAllBrandingAppearances();
    
    res.status(200).json({
      success: true,
      data: brandingAppearances
    });
  } catch (error) {
    next(createError(500, 'Error retrieving branding appearances'));
  }
};

// Get BrandingAppearance by ID
const getBrandingAppearanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const brandingAppearance = await brandingAppearanceModel.getBrandingAppearanceById(id);
    
    if (!brandingAppearance) {
      return next(createError(404, 'Branding appearance not found'));
    }
    
    res.status(200).json({
      success: true,
      data: brandingAppearance
    });
  } catch (error) {
    next(createError(500, 'Error retrieving branding appearance'));
  }
};

// Create new BrandingAppearance
const createBrandingAppearance = async (req, res, next) => {
  try {
    // Check if request is multipart/form-data (for file upload)
    const isMultipart = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');
    
    if (isMultipart) {
      // Handle file upload
      uploadLogo(req, res, async function(err) {
        if (err) {
          // Handle multer errors more gracefully
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(createError(400, 'File too large. Maximum size is 5MB.'));
          }
          if (err.message === 'Unexpected end of form' || err.message.includes('Unexpected end of form')) {
            // If form is incomplete, treat as if no file was uploaded and continue
            // This allows requests without files to still work
            console.warn('Multer form parsing warning:', err.message);
            // Continue processing without file
          } else {
            return next(createError(400, err.message));
          }
        }
        
        await processCreateRequest(req, res, next);
      });
    } else {
      // Handle JSON request (no file upload)
      await processCreateRequest(req, res, next);
    }
  } catch (error) {
    next(createError(500, 'Error processing request'));
  }
};

// Helper function to process create request
const processCreateRequest = async (req, res, next) => {
  try {
    const { 
      logo, // Can be a URL string if not uploading file
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      buttonCorner,
      darkThemes
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

    // Determine logo path: uploaded file > provided URL > null
    let logoPath = null;
    if (req.file) {
      logoPath = getImageUrl(req.file.filename);
    } else if (logo) {
      logoPath = logo; // Use provided URL string
    }

    // Prepare data for database
    const brandingAppearanceData = {
      logo: logoPath,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      buttonCorner,
      darkThemes: convertToBoolean(darkThemes)
    };
    
    const newBrandingAppearance = await brandingAppearanceModel.createBrandingAppearance(brandingAppearanceData);
    
    res.status(201).json({
      success: true,
      data: newBrandingAppearance
    });
  } catch (error) {
    // Remove uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating branding appearance:', error);
    next(createError(500, `Error creating branding appearance: ${error.message}`));
  }
};

// Update BrandingAppearance
const updateBrandingAppearance = async (req, res, next) => {
  try {
    // Check if request is multipart/form-data (for file upload)
    const isMultipart = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');
    
    if (isMultipart) {
      // Handle file upload
      uploadLogo(req, res, async function(err) {
        if (err) {
          // Handle multer errors more gracefully
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(createError(400, 'File too large. Maximum size is 5MB.'));
          }
          if (err.message === 'Unexpected end of form' || err.message.includes('Unexpected end of form')) {
            // If form is incomplete, treat as if no file was uploaded and continue
            // This allows requests without files to still work
            console.warn('Multer form parsing warning:', err.message);
            // Continue processing without file
          } else {
            return next(createError(400, err.message));
          }
        }
        
        await processUpdateRequest(req, res, next);
      });
    } else {
      // Handle JSON request (no file upload)
      await processUpdateRequest(req, res, next);
    }
  } catch (error) {
    next(createError(500, 'Error processing request'));
  }
};

// Helper function to process update request
const processUpdateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      logo, // Can be a URL string if not uploading file
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      buttonCorner,
      darkThemes
    } = req.body;
    
    // Check if BrandingAppearance exists
    const existingBrandingAppearance = await brandingAppearanceModel.getBrandingAppearanceById(id);
    if (!existingBrandingAppearance) {
      // Remove uploaded file if record doesn't exist
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return next(createError(404, 'Branding appearance not found'));
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

    // Process logo: uploaded file > provided URL > keep existing
    let logoPath = existingBrandingAppearance.logo;
    if (req.file) {
      // Delete old logo file if it exists
      if (existingBrandingAppearance.logo && existingBrandingAppearance.logo.startsWith('/uploads/')) {
        const oldLogoPath = existingBrandingAppearance.logo.replace('/uploads/', '');
        const fullOldPath = require('path').join(__dirname, '../uploads', oldLogoPath);
        if (fs.existsSync(fullOldPath)) {
          try {
            fs.unlinkSync(fullOldPath);
          } catch (unlinkError) {
            console.error('Error deleting old logo:', unlinkError);
          }
        }
      }
      logoPath = getImageUrl(req.file.filename);
    } else if (logo !== undefined) {
      // If logo is explicitly provided (including null to remove it)
      if (logo === null || logo === '') {
        // Delete old logo file if removing it
        if (existingBrandingAppearance.logo && existingBrandingAppearance.logo.startsWith('/uploads/')) {
          const oldLogoPath = existingBrandingAppearance.logo.replace('/uploads/', '');
          const fullOldPath = require('path').join(__dirname, '../uploads', oldLogoPath);
          if (fs.existsSync(fullOldPath)) {
            try {
              fs.unlinkSync(fullOldPath);
            } catch (unlinkError) {
              console.error('Error deleting old logo:', unlinkError);
            }
          }
        }
        logoPath = null;
      } else {
        logoPath = logo; // Use provided URL string
      }
    }

    // Prepare data for database
    const brandingAppearanceData = {
      logo: logoPath,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      buttonCorner,
      darkThemes: darkThemes !== undefined ? convertToBoolean(darkThemes) : undefined
    };
    
    const updatedBrandingAppearance = await brandingAppearanceModel.updateBrandingAppearance(id, brandingAppearanceData);
    
    res.status(200).json({
      success: true,
      data: updatedBrandingAppearance
    });
  } catch (error) {
    // Remove uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error updating branding appearance:', error);
    next(createError(500, `Error updating branding appearance: ${error.message}`));
  }
};

// Delete BrandingAppearance
const deleteBrandingAppearance = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if BrandingAppearance exists
    const existingBrandingAppearance = await brandingAppearanceModel.getBrandingAppearanceById(id);
    if (!existingBrandingAppearance) {
      return next(createError(404, 'Branding appearance not found'));
    }
    
    // Delete the logo file if it exists
    if (existingBrandingAppearance.logo) {
      const logoPath = existingBrandingAppearance.logo.replace('/uploads/', '');
      const fullPath = require('path').join(__dirname, '../uploads', logoPath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (unlinkError) {
          console.error('Error deleting logo file:', unlinkError);
        }
      }
    }
    
    // Delete the BrandingAppearance
    await brandingAppearanceModel.deleteBrandingAppearance(id);
    
    res.status(200).json({
      success: true,
      message: 'Branding appearance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting branding appearance:', error);
    next(createError(500, `Error deleting branding appearance: ${error.message}`));
  }
};

module.exports = {
  uploadLogo,
  getAllBrandingAppearances,
  getBrandingAppearanceById,
  createBrandingAppearance,
  updateBrandingAppearance,
  deleteBrandingAppearance
};

