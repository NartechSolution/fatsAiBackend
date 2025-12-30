const SubMegaMenu = require('../models/subMegaMenu');
const MegaMenu = require('../models/megaMenu');
const { upload, getImageUrl } = require('../utils/uploadUtils');

// Middleware for handling file uploads
exports.uploadSubMegaMenuImage = upload.single('image');

// Create a new sub mega menu
exports.createSubMegaMenu = async (req, res) => {
  try {
    const { megamenu_id, name_en, name_ar, caption, caption_ar, status, url, openIs, roleVisibility } = req.body;
    
    // Check if the mega menu exists
    const megaMenu = await MegaMenu.getById(megamenu_id);
    if (!megaMenu) {
      return res.status(404).json({
        success: false,
        message: 'Mega menu not found'
      });
    }
    
    // Process image if uploaded
    let imagePath = null;
    if (req.file) {
      imagePath = getImageUrl(req.file.filename);
    }
    
    const subMegaMenu = await SubMegaMenu.create({
      megamenu_id: parseInt(megamenu_id),
      name_en,
      name_ar,
      image: imagePath,
      caption,
      caption_ar,
      status: status !== undefined ? status : true,
      url,
      openIs,
      roleVisibility
    });
    
    res.status(201).json({
      success: true,
      data: subMegaMenu
    });
  } catch (error) {
    console.error('Error creating sub mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sub mega menu',
      error: error.message
    });
  }
};

// Get all sub mega menus
exports.getAllSubMegaMenus = async (req, res) => {
  try {
    const subMegaMenus = await SubMegaMenu.getAll();
    
    res.status(200).json({
      success: true,
      count: subMegaMenus.length,
      data: subMegaMenus
    });
  } catch (error) {
    console.error('Error getting sub mega menus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sub mega menus',
      error: error.message
    });
  }
};

// Get sub mega menus by mega menu ID
exports.getSubMegaMenusByMegaMenuId = async (req, res) => {
  try {
    const subMegaMenus = await SubMegaMenu.getByMegaMenuId(req.params.megamenu_id);
    
    res.status(200).json({
      success: true,
      count: subMegaMenus.length,
      data: subMegaMenus
    });
  } catch (error) {
    console.error('Error getting sub mega menus by mega menu ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sub mega menus',
      error: error.message
    });
  }
};

// Get a single sub mega menu
exports.getSubMegaMenu = async (req, res) => {
  try {
    const subMegaMenu = await SubMegaMenu.getById(req.params.id);
    
    if (!subMegaMenu) {
      return res.status(404).json({
        success: false,
        message: 'Sub mega menu not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subMegaMenu
    });
  } catch (error) {
    console.error('Error getting sub mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sub mega menu',
      error: error.message
    });
  }
};

// Update a sub mega menu
exports.updateSubMegaMenu = async (req, res) => {
  try {
    const { megamenu_id, name_en, name_ar, caption, caption_ar, status, url, openIs, roleVisibility } = req.body;
    
    // Check if sub mega menu exists
    const existingSubMegaMenu = await SubMegaMenu.getById(req.params.id);
    
    if (!existingSubMegaMenu) {
      return res.status(404).json({
        success: false,
        message: 'Sub mega menu not found'
      });
    }
    
    // If megamenu_id is provided, check if the mega menu exists
    if (megamenu_id) {
      const megaMenu = await MegaMenu.getById(megamenu_id);
      if (!megaMenu) {
        return res.status(404).json({
          success: false,
          message: 'Mega menu not found'
        });
      }
    }
    
    // Process image if uploaded
    let imagePath = existingSubMegaMenu.image;
    if (req.file) {
      imagePath = getImageUrl(req.file.filename);
    }
    
    // Update sub mega menu
    const subMegaMenu = await SubMegaMenu.update(req.params.id, {
      megamenu_id: megamenu_id ? parseInt(megamenu_id) : existingSubMegaMenu.megamenu_id,
      name_en: name_en !== undefined ? name_en : existingSubMegaMenu.name_en,
      name_ar: name_ar !== undefined ? name_ar : existingSubMegaMenu.name_ar,
      image: imagePath,
      caption: caption !== undefined ? caption : existingSubMegaMenu.caption,
      caption_ar: caption_ar !== undefined ? caption_ar : existingSubMegaMenu.caption_ar,
      status: status !== undefined ? status : existingSubMegaMenu.status,
      url: url !== undefined ? url : existingSubMegaMenu.url,
      openIs: openIs !== undefined ? openIs : existingSubMegaMenu.openIs,
      roleVisibility: roleVisibility !== undefined ? roleVisibility : existingSubMegaMenu.roleVisibility
    });
    
    res.status(200).json({
      success: true,
      data: subMegaMenu
    });
  } catch (error) {
    console.error('Error updating sub mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sub mega menu',
      error: error.message
    });
  }
};

// Delete a sub mega menu
exports.deleteSubMegaMenu = async (req, res) => {
  try {
    // Check if sub mega menu exists
    const subMegaMenu = await SubMegaMenu.getById(req.params.id);
    
    if (!subMegaMenu) {
      return res.status(404).json({
        success: false,
        message: 'Sub mega menu not found'
      });
    }
    
    // Delete sub mega menu
    await SubMegaMenu.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Sub mega menu deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sub mega menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sub mega menu',
      error: error.message
    });
  }
}; 