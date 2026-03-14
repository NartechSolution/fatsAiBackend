const prisma = require('../prisma/client');

// Create one or many AssetMovement records
exports.createAssetMovements = async (req, res) => {
  try {
    const {
      newassetId,
      newassetIds,
      locationTagId,
      requestedBy,
      approvedBy,
      remarks,
    } = req.body;

    if (!locationTagId) {
      return res.status(400).json({
        success: false,
        message: 'locationTagId is required',
      });
    }

    const idsArray = Array.isArray(newassetIds)
      ? newassetIds
      : newassetId
      ? [newassetId]
      : [];

    if (!idsArray.length) {
      return res.status(400).json({
        success: false,
        message: 'newassetId or newassetIds (array) is required',
      });
    }

    const parsedLocationTagId = parseInt(locationTagId, 10);
    if (Number.isNaN(parsedLocationTagId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid locationTagId',
      });
    }

    const locationTag = await prisma.locationTag.findUnique({
      where: { id: parsedLocationTagId },
    });

    if (!locationTag) {
      return res.status(404).json({
        success: false,
        message: 'LocationTag not found',
      });
    }

    const parsedNewAssetIds = [];
    for (const id of idsArray) {
      const parsed = parseInt(id, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({
          success: false,
          message: `Invalid newassetId value: ${id}`,
        });
      }
      parsedNewAssetIds.push(parsed);
    }

    const foundAssets = await prisma.newAsset.findMany({
      where: { id: { in: parsedNewAssetIds } },
      select: { id: true },
    });

    if (foundAssets.length !== parsedNewAssetIds.length) {
      const foundIds = new Set(foundAssets.map((a) => a.id));
      const missing = parsedNewAssetIds.filter((id) => !foundIds.has(id));
      return res.status(404).json({
        success: false,
        message: `Some NewAssets not found`,
        missingIds: missing,
      });
    }

    const dataToCreate = parsedNewAssetIds.map((id) => ({
      newassetId: id,
      locationTagId: parsedLocationTagId,
      requestedBy: requestedBy || null,
      approvedBy: approvedBy || null,
      remarks: remarks || null,
    }));

    const created = await Promise.all(
      dataToCreate.map((data) =>
        prisma.assetMovement.create({
          data,
          include: {
            newAsset: true,
            locationTag: true,
          },
        })
      )
    );

    return res.status(201).json({
      success: true,
      message:
        created.length > 1
          ? `${created.length} asset movements created successfully`
          : 'Asset movement created successfully',
      count: created.length,
      data: created,
    });
  } catch (error) {
    console.error('Error creating asset movements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create asset movements',
      error: error.message,
    });
  }
};

// Get all AssetMovement records with optional filters
exports.getAllAssetMovements = async (req, res) => {
  try {
    const { newassetId, locationTagId } = req.query;

    const where = {};
    if (newassetId) {
      const parsed = parseInt(newassetId, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid newassetId',
        });
      }
      where.newassetId = parsed;
    }

    if (locationTagId) {
      const parsed = parseInt(locationTagId, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid locationTagId',
        });
      }
      where.locationTagId = parsed;
    }

    const items = await prisma.assetMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        newAsset: true,
        locationTag: true,
      },
    });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching asset movements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch asset movements',
      error: error.message,
    });
  }
};

// Get AssetMovement by ID
exports.getAssetMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid id',
      });
    }

    const item = await prisma.assetMovement.findUnique({
      where: { id: parsedId },
      include: {
        newAsset: true,
        locationTag: true,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Asset movement not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching asset movement by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch asset movement',
      error: error.message,
    });
  }
};

// Update AssetMovement
exports.updateAssetMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      newassetId,
      locationTagId,
      requestedBy,
      approvedBy,
      remarks,
    } = req.body;

    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid id',
      });
    }

    const existing = await prisma.assetMovement.findUnique({
      where: { id: parsedId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Asset movement not found',
      });
    }

    let newNewassetId = existing.newassetId;
    if (newassetId !== undefined) {
      const parsedNewassetId = parseInt(newassetId, 10);
      if (Number.isNaN(parsedNewassetId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid newassetId',
        });
      }

      const asset = await prisma.newAsset.findUnique({
        where: { id: parsedNewassetId },
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'NewAsset not found',
        });
      }

      newNewassetId = parsedNewassetId;
    }

    let newLocationTagId = existing.locationTagId;
    if (locationTagId !== undefined) {
      const parsedLocationTagId = parseInt(locationTagId, 10);
      if (Number.isNaN(parsedLocationTagId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid locationTagId',
        });
      }

      const locationTag = await prisma.locationTag.findUnique({
        where: { id: parsedLocationTagId },
      });

      if (!locationTag) {
        return res.status(404).json({
          success: false,
          message: 'LocationTag not found',
        });
      }

      newLocationTagId = parsedLocationTagId;
    }

    const updated = await prisma.assetMovement.update({
      where: { id: parsedId },
      data: {
        newassetId: newNewassetId,
        locationTagId: newLocationTagId,
        requestedBy:
          requestedBy !== undefined ? requestedBy || null : existing.requestedBy,
        approvedBy:
          approvedBy !== undefined ? approvedBy || null : existing.approvedBy,
        remarks: remarks !== undefined ? remarks || null : existing.remarks,
      },
      include: {
        newAsset: true,
        locationTag: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Asset movement updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating asset movement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update asset movement',
      error: error.message,
    });
  }
};

// Delete AssetMovement
exports.deleteAssetMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid id',
      });
    }

    const existing = await prisma.assetMovement.findUnique({
      where: { id: parsedId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Asset movement not found',
      });
    }

    await prisma.assetMovement.delete({
      where: { id: parsedId },
    });

    return res.status(200).json({
      success: true,
      message: 'Asset movement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting asset movement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete asset movement',
      error: error.message,
    });
  }
};

