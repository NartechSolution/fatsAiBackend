const prisma = require('../prisma/client');

// Controller methods for SubFooter CRUD operations
exports.createSubFooter = async (req, res) => {
  try {
    const { name, status } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        error: 'Required field missing: name is required' 
      });
    }
    
    // Create new sub footer
    const subFooter = await prisma.subFooter.create({
      data: {
        name,
        status: status || 'active'
      }
    });
    
    res.status(201).json({ 
      message: 'Sub footer created successfully',
      subFooter
    });
  } catch (error) {
    console.error('Error creating sub footer:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Sub footer with this name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllSubFooters = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 records per page
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const includeFooterItems = req.query.includeFooterItems !== 'false'; // Include children (default true)
    
    // Build filter object
    const where = {};
    if (status !== undefined) where.status = status;
    
    // Get sub footers with pagination, sort by createdAt descending (newest first)
    const subFooters = await prisma.subFooter.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: includeFooterItems ? { footerItems: true } : undefined
    });
    
    // Get total count
    const totalItems = await prisma.subFooter.count({ where });
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
      subFooters
    });
  } catch (error) {
    console.error('Error retrieving sub footers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSubFooterById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find sub footer by ID with child footerItems included
    const subFooter = await prisma.subFooter.findUnique({
      where: { id: parseInt(id) },
      include: { footerItems: true }
    });
    
    if (!subFooter) {
      return res.status(404).json({ message: 'Sub footer not found' });
    }
    
    res.status(200).json(subFooter);
  } catch (error) {
    console.error('Error retrieving sub footer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateSubFooter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    
    // Check if sub footer exists
    const existingSubFooter = await prisma.subFooter.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSubFooter) {
      return res.status(404).json({ message: 'Sub footer not found' });
    }
    
    // Update sub footer
    const updatedSubFooter = await prisma.subFooter.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : existingSubFooter.name,
        status: status !== undefined ? status : existingSubFooter.status
      }
    });
    
    res.status(200).json({
      message: 'Sub footer updated successfully',
      subFooter: updatedSubFooter
    });
  } catch (error) {
    console.error('Error updating sub footer:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Sub footer with this name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteSubFooter = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if sub footer exists
    const existingSubFooter = await prisma.subFooter.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSubFooter) {
      return res.status(404).json({ message: 'Sub footer not found' });
    }
    
    // Delete sub footer
    await prisma.subFooter.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({ message: 'Sub footer deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub footer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

