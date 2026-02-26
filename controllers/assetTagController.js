const prisma = require('../prisma/client');

/**
 * Create new asset tag(s)
 * POST /api/asset-tags
 *
 * Accepts:
 * - single serial: serial: "ABC123"
 * - multiple serials: serial: ["ABC123", "DEF456"]
 */
exports.createAssetTag = async (req, res) => {
  try {
    const { newassetId, serial } = req.body;

    // Normalize serial(s) into an array for easier handling
    const serialArray = Array.isArray(serial)
      ? serial
      : serial
      ? [serial]
      : [];

    // Validate required fields
    if (!newassetId || serialArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'newassetId and at least one serial are required'
      });
    }

    // Clean and filter serials
    const cleanedSerials = serialArray
      .map((s) => (s != null ? String(s).trim() : ''))
      .filter((s) => s.length > 0);

    if (cleanedSerials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Serial values cannot be empty'
      });
    }

    // Check if NewAsset exists
    const newAssetIdInt = parseInt(newassetId);
    const newAsset = await prisma.newAsset.findUnique({
      where: { id: newAssetIdInt }
    });

    if (!newAsset) {
      return res.status(404).json({
        success: false,
        message: 'NewAsset not found'
      });
    }

    // Create one or many asset tags
    let created;
    if (cleanedSerials.length === 1) {
      created = await prisma.assetTag.create({
        data: {
          newassetId: newAssetIdInt,
          serial: cleanedSerials[0]
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
    } else {
      // Create multiple tags and return full records
      created = await Promise.all(
        cleanedSerials.map((s) =>
          prisma.assetTag.create({
            data: {
              newassetId: newAssetIdInt,
              serial: s
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
          })
        )
      );
    }

    res.status(201).json({
      success: true,
      message:
        cleanedSerials.length === 1
          ? 'Asset tag created successfully'
          : 'Asset tags created successfully',
      data: created
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
 * Get asset tags by newassetId
 * GET /api/asset-tags/newasset/:newassetId
 */
exports.getAssetTagsByNewAssetId = async (req, res) => {
  try {
    const { newassetId } = req.params;

    // Validate newassetId
    const assetId = parseInt(newassetId);
    if (isNaN(assetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid newassetId'
      });
    }

    // Check if NewAsset exists
    const newAsset = await prisma.newAsset.findUnique({
      where: { id: assetId }
    });

    if (!newAsset) {
      return res.status(404).json({
        success: false,
        message: 'NewAsset not found'
      });
    }

    // Get all asset tags for this newassetId
    const assetTags = await prisma.assetTag.findMany({
      where: {
        newassetId: assetId
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
    console.error('Error fetching asset tags by newassetId:', error);
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
