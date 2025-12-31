const prisma = require('../prisma/client');
const { getImageUrl } = require('../utils/uploadUtils');
const fs = require('fs');
const path = require('path');

// Controller methods for FooterItem CRUD operations
exports.createFooterItem = async (req, res) => {
  try {
    const {
      name,
      url,
      openIn,
      description,
      roleVisibility,
      textIcon
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Required field missing: name is required'
      });
    }
    
    // Handle icon file upload
    let iconPath = null;
    if (req.file) {
      iconPath = getImageUrl(req.file.filename);
    }
    
    // Create new footer item
    const footerItem = await prisma.footerItem.create({
      data: {
        name,
        url: url || null,
        openIn: openIn || null,
        icon: iconPath,
        textIcon: textIcon || null,
        description: description || null,
        roleVisibility: roleVisibility || null
      }
    });
    
    res.status(201).json({
      message: 'Footer item created successfully',
      footerItem
    });
  } catch (error) {
    console.error('Error creating footer item:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A record with this combination already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllFooterItems = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const roleVisibility = req.query.roleVisibility;
    const search = req.query.search;
    
    // Build filter object
    const where = {};
    if (roleVisibility && roleVisibility !== 'all') {
      where.roleVisibility = {
        contains: roleVisibility
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get footer items with pagination, sort by createdAt descending (newest first)
    const footerItems = await prisma.footerItem.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    // Get total count
    const totalItems = await prisma.footerItem.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      pagination: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      footerItems
    });
  } catch (error) {
    console.error('Error retrieving footer items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFooterItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find footer item by ID
    const footerItem = await prisma.footerItem.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!footerItem) {
      return res.status(404).json({ message: 'Footer item not found' });
    }
    
    res.status(200).json(footerItem);
  } catch (error) {
    console.error('Error retrieving footer item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateFooterItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      url,
      openIn,
      description,
      roleVisibility,
      textIcon
    } = req.body;
    
    // Check if footer item exists
    const existingFooterItem = await prisma.footerItem.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingFooterItem) {
      return res.status(404).json({ message: 'Footer item not found' });
    }
    
    // Handle icon file upload
    let iconPath = existingFooterItem.icon;
    if (req.file) {
      // Delete old icon file if it exists
      if (existingFooterItem.icon) {
        const oldFilePath = path.join(__dirname, '..', existingFooterItem.icon.replace(/^\//, ''));
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err && err.code !== 'ENOENT') console.error('Error deleting old file:', err);
          });
        }
      }
      iconPath = getImageUrl(req.file.filename);
    }
    
    // Update footer item
    const updatedFooterItem = await prisma.footerItem.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : existingFooterItem.name,
        url: url !== undefined ? (url || null) : existingFooterItem.url,
        openIn: openIn !== undefined ? (openIn || null) : existingFooterItem.openIn,
        icon: iconPath,
        textIcon: textIcon !== undefined ? (textIcon || null) : existingFooterItem.textIcon,
        description: description !== undefined ? (description || null) : existingFooterItem.description,
        roleVisibility: roleVisibility !== undefined ? (roleVisibility || null) : existingFooterItem.roleVisibility
      }
    });
    
    res.status(200).json({
      message: 'Footer item updated successfully',
      footerItem: updatedFooterItem
    });
  } catch (error) {
    console.error('Error updating footer item:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A record with this combination already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteFooterItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if footer item exists
    const existingFooterItem = await prisma.footerItem.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingFooterItem) {
      return res.status(404).json({ message: 'Footer item not found' });
    }
    
    // Delete icon file if it exists
    if (existingFooterItem.icon) {
      const filePath = path.join(__dirname, '..', existingFooterItem.icon.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') console.error('Error deleting file:', err);
        });
      }
    }
    
    // Delete footer item
    await prisma.footerItem.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({ message: 'Footer item deleted successfully' });
  } catch (error) {
    console.error('Error deleting footer item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

