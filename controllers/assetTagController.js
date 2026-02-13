const prisma = require('../prisma/client');

/**
 * Create a new asset tag
 * POST /api/asset-tags
 */
exports.createAssetTag = async (req, res) => {
  try {
    const { newassetId, serial } = req.body;

    // Validate required fields
    if (!newassetId || !serial) {
      return res.status(400).json({
        success: false,
        message: 'newassetId and serial are required'
      });
    }

    // Check if NewAsset exists
    const newAsset = await prisma.newAsset.findUnique({
      where: { id: parseInt(newassetId) }
    });

    if (!newAsset) {
      return res.status(404).json({
        success: false,
        message: 'NewAsset not found'
      });
    }

    // Create asset tag
    const assetTag = await prisma.assetTag.create({
      data: {
        newassetId: parseInt(newassetId),
        serial: serial.trim()
      },
      include: {
        newAsset: {
          select: {
            id: true,
            name: true,
            serialNo: true,
            status: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Asset tag created successfully',
      data: assetTag
    });
  } catch (error) {
    console.error('Error creating asset tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset tag',
      error: error.message
    });
  }
};

/**
 * Get all asset tags
 * GET /api/asset-tags
 */
exports.getAllAssetTags = async (req, res) => {
  try {
    const { newassetId } = req.query;

    // Build where clause
    const where = {};
    if (newassetId) {
      where.newassetId = parseInt(newassetId);
    }

    const assetTags = await prisma.assetTag.findMany({
      where,
      include: {
        newAsset: {
          select: {
            id: true,
            name: true,
            serialNo: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: assetTags.length,
      data: assetTags
    });
  } catch (error) {
    console.error('Error fetching asset tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset tags',
      error: error.message
    });
  }
};

/**
 * Get asset tag by ID
 * GET /api/asset-tags/:id
 */
exports.getAssetTagById = async (req, res) => {
  try {
    const { id } = req.params;

    const assetTag = await prisma.assetTag.findUnique({
      where: { id: parseInt(id) },
      include: {
        newAsset: {
          select: {
            id: true,
            name: true,
            serialNo: true,
            status: true
          }
        }
      }
    });

    if (!assetTag) {
      return res.status(404).json({
        success: false,
        message: 'Asset tag not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assetTag
    });
  } catch (error) {
    console.error('Error fetching asset tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset tag',
      error: error.message
    });
  }
};

/**
 * Update asset tag
 * PUT /api/asset-tags/:id
 */
exports.updateAssetTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { newassetId, serial } = req.body;

    // Check if asset tag exists
    const existingAssetTag = await prisma.assetTag.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAssetTag) {
      return res.status(404).json({
        success: false,
        message: 'Asset tag not found'
      });
    }

    // Build update data
    const updateData = {};
    if (newassetId !== undefined) {
      // Check if NewAsset exists
      const newAsset = await prisma.newAsset.findUnique({
        where: { id: parseInt(newassetId) }
      });

      if (!newAsset) {
        return res.status(404).json({
          success: false,
          message: 'NewAsset not found'
        });
      }

      updateData.newassetId = parseInt(newassetId);
    }
    if (serial !== undefined) {
      updateData.serial = serial.trim();
    }

    // Update asset tag
    const updatedAssetTag = await prisma.assetTag.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        newAsset: {
          select: {
            id: true,
            name: true,
            serialNo: true,
            status: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Asset tag updated successfully',
      data: updatedAssetTag
    });
  } catch (error) {
    console.error('Error updating asset tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset tag',
      error: error.message
    });
  }
};

/**
 * Delete asset tag
 * DELETE /api/asset-tags/:id
 */
exports.deleteAssetTag = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if asset tag exists
    const assetTag = await prisma.assetTag.findUnique({
      where: { id: parseInt(id) }
    });

    if (!assetTag) {
      return res.status(404).json({
        success: false,
        message: 'Asset tag not found'
      });
    }

    // Delete asset tag
    await prisma.assetTag.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Asset tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset tag',
      error: error.message
    });
  }
};
