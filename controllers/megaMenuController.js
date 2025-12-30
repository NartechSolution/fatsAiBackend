const MegaMenu = require('../models/megaMenu');
const { upload, getImageUrl } = require('../utils/uploadUtils');

// Middleware for handling file uploads
exports.uploadMegaMenuIcon = upload.single('icon');

// Create a new mega menu
exports.createMegaMenu = async (req, res) => {
  try {
    const { name_en, name_ar, status } = req.body;
    
    // Process icon if uploaded
    let iconPath = null;
    if (req.file) {
      iconPath = getImageUrl(req.file.filename);
    }
    
    const megaMenu = await MegaMenu.create({
      name_en,
      name_ar,
      icon: iconPath,
      status: status !== undefined ? status : true
    });
    
    res.status(201).json({
      success: true,
      data: megaMenu
    });
  } catch (error) {
    console.error('Error creating mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mega menu',
      error: error.message
    });
  }
};

// Get all mega menus
exports.getAllMegaMenus = async (req, res) => {
  try {
    const megaMenus = await MegaMenu.getAll();
    
    res.status(200).json({
      success: true,
      count: megaMenus.length,
      data: megaMenus
    });
  } catch (error) {
    console.error('Error getting mega menus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mega menus',
      error: error.message
    });
  }
};

// Get a single mega menu
exports.getMegaMenu = async (req, res) => {
  try {
    const megaMenu = await MegaMenu.getById(req.params.id);
    
    if (!megaMenu) {
      return res.status(404).json({
        success: false,
        message: 'Mega menu not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: megaMenu
    });
  } catch (error) {
    console.error('Error getting mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mega menu',
      error: error.message
    });
  }
};

// Update a mega menu
exports.updateMegaMenu = async (req, res) => {
  try {
    const { name_en, name_ar, status } = req.body;
    
    // Check if mega menu exists
    const existingMegaMenu = await MegaMenu.getById(req.params.id);
    
    if (!existingMegaMenu) {
      return res.status(404).json({
        success: false,
        message: 'Mega menu not found'
      });
    }
    
    // Process icon if uploaded
    let iconPath = existingMegaMenu.icon;
    if (req.file) {
      iconPath = getImageUrl(req.file.filename);
    }
    
    // Update mega menu
    const megaMenu = await MegaMenu.update(req.params.id, {
      name_en: name_en !== undefined ? name_en : existingMegaMenu.name_en,
      name_ar: name_ar !== undefined ? name_ar : existingMegaMenu.name_ar,
      icon: iconPath,
      status: status !== undefined ? status : existingMegaMenu.status
    });
    
    res.status(200).json({
      success: true,
      data: megaMenu
    });
  } catch (error) {
    console.error('Error updating mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mega menu',
      error: error.message
    });
  }
};

// Delete a mega menu
exports.deleteMegaMenu = async (req, res) => {
  try {
    // Check if mega menu exists
    const megaMenu = await MegaMenu.getById(req.params.id);
    
    if (!megaMenu) {
      return res.status(404).json({
        success: false,
        message: 'Mega menu not found'
      });
    }
    
    // Delete mega menu
    await MegaMenu.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Mega menu deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mega menu',
      error: error.message
    });
  }
}; 