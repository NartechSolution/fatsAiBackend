const prisma = require('../prisma/client');

// Controller methods for MainFooter CRUD operations
exports.createMainFooter = async (req, res) => {
  try {
    const { name, status, textIcon } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        error: 'Required field missing: name is required' 
      });
    }
    
    // Create new main footer
    const mainFooter = await prisma.mainFooter.create({
      data: {
        name,
        status: status || 'active',
        textIcon
      }
    });
    
    res.status(201).json({ 
      message: 'Main footer created successfully',
      mainFooter
    });
  } catch (error) {
    console.error('Error creating main footer:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Main footer with this name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllMainFooters = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 records per page
    const skip = (page - 1) * limit;
    const status = req.query.status;
    
    // Build filter object
    const where = {};
    if (status !== undefined) where.status = status;
    
    // Get main footers with pagination, sort by createdAt descending (newest first)
    const mainFooters = await prisma.mainFooter.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    // Get total count
    const totalItems = await prisma.mainFooter.count({ where });
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
      mainFooters
    });
  } catch (error) {
    console.error('Error retrieving main footers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMainFooterById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find main footer by ID
    const mainFooter = await prisma.mainFooter.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!mainFooter) {
      return res.status(404).json({ message: 'Main footer not found' });
    }
    
    res.status(200).json(mainFooter);
  } catch (error) {
    console.error('Error retrieving main footer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMainFooter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, textIcon } = req.body;
    
    // Check if main footer exists
    const existingMainFooter = await prisma.mainFooter.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingMainFooter) {
      return res.status(404).json({ message: 'Main footer not found' });
    }
    
    // Update main footer
    const updatedMainFooter = await prisma.mainFooter.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : existingMainFooter.name,
        status: status !== undefined ? status : existingMainFooter.status,
        textIcon: textIcon !== undefined ? textIcon : existingMainFooter.textIcon
      }
    });
    
    res.status(200).json({
      message: 'Main footer updated successfully',
      mainFooter: updatedMainFooter
    });
  } catch (error) {
    console.error('Error updating main footer:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Main footer with this name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteMainFooter = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if main footer exists
    const existingMainFooter = await prisma.mainFooter.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingMainFooter) {
      return res.status(404).json({ message: 'Main footer not found' });
    }
    
    // Delete main footer
    await prisma.mainFooter.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({ message: 'Main footer deleted successfully' });
  } catch (error) {
    console.error('Error deleting main footer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

