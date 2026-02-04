const prisma = require('../prisma/client');
const { upload, getImageUrl } = require('../utils/uploadUtils');

// Middleware for handling file uploads (image field)
exports.uploadNewAssetImage = upload.single('image');

// Create a new NewAsset
exports.createNewAsset = async (req, res) => {
  try {
    const user = req.user || req.admin || {};
    const isAdmin = user.role === 'admin' || !!user.adminId;
    
    const {
      name,
      assetCategoryId,
      serialNo,
      departmentId,
      employeeId,
      status,
      assetConditionId,
      purchaseDate,
      warrantyExpiry,
      locationId,
      description,
      userId, // Optional: can be passed in body, or auto-set for members
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !assetCategoryId ||
      !serialNo ||
      !departmentId ||
      !employeeId ||
      !status ||
      !assetConditionId ||
      !locationId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Required fields: name, assetCategoryId, serialNo, departmentId, employeeId, status, assetConditionId, locationId',
      });
    }

    // Check related records
    const assetCategory = await prisma.assetCategory.findUnique({
      where: { id: parseInt(assetCategoryId, 10) },
    });
    if (!assetCategory) {
      return res
        .status(404)
        .json({ success: false, message: 'AssetCategory not found' });
    }

    const department = await prisma.department.findUnique({
      where: { id: parseInt(departmentId, 10) },
    });
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: 'Department not found' });
    }

    const employee = await prisma.employeeList.findUnique({
      where: { id: parseInt(employeeId, 10) },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found' });
    }

    const assetCondition = await prisma.assetCondition.findUnique({
      where: { id: parseInt(assetConditionId, 10) },
    });
    if (!assetCondition) {
      return res
        .status(404)
        .json({ success: false, message: 'AssetCondition not found' });
    }

    // locationId now refers to a City record
    const city = await prisma.city.findUnique({
      where: { id: parseInt(locationId, 10) },
    });
    if (!city) {
      return res
        .status(404)
        .json({ 
          success: false, 
          message: `City with id ${locationId} not found. Please ensure the city exists before creating an asset.` 
        });
    }

    // Image
    const imagePath = req.file ? getImageUrl(req.file.filename) : null;

    // Parse dates
    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    const parsedWarrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;

    // Determine userId: use provided userId, or auto-set for members
    let finalUserId = userId || null;
    if (!isAdmin && user.userId) {
      // If member is creating asset, automatically assign to their userId
      finalUserId = user.userId;
    }

    // Create asset - try without include first to avoid relation issues
    const newAsset = await prisma.newAsset.create({
      data: {
        name,
        serialNo,
        status,
        description: description || null,
        image: imagePath,
        purchaseDate: parsedPurchaseDate,
        warrantyExpiry: parsedWarrantyExpiry,
        assetCategoryId: parseInt(assetCategoryId, 10),
        departmentId: parseInt(departmentId, 10),
        employeeId: parseInt(employeeId, 10),
        assetConditionId: parseInt(assetConditionId, 10),
        locationId: parseInt(locationId, 10),
        userId: finalUserId, // Set userId for member assets
      },
    });

    // Fetch with relations separately to avoid foreign key constraint issues
    const newAssetWithRelations = await prisma.newAsset.findUnique({
      where: { id: newAsset.id },
      include: {
        assetCategory: true,
        department: true,
        employee: true,
        assetCondition: true,
        location: true,
        user: true, // Include user relation
      },
    });

    res.status(201).json({
      success: true,
      message: 'New asset created successfully',
      data: newAssetWithRelations,
    });
  } catch (error) {
    console.error('Error creating new asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create new asset',
      error: error.message,
    });
  }
};

// Get all NewAssets
// - Admins: see all assets
// - Members (regular users): see only assets assigned to their employee record (matched by email)
exports.getAllNewAssets = async (req, res) => {
  try {
    // Check both req.user (from verifyToken) and req.admin (from verifyAdminToken)
    const user = req.user || req.admin || {};
    
    // Determine if the requester is an admin (based on admin JWT payload)
    // Admin tokens have adminId and role: 'admin'
    const isAdmin = user.role === 'admin' || !!user.adminId;

    let where = {};

    // For non-admin users (members/Users), filter by userId
    // Members can only see assets assigned to them (where userId matches)
    if (!isAdmin) {
      // Member is a User - filter by userId
      if (!user.userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in token. Cannot determine user assets.',
        });
      }
      
      console.log('Member (User) access - filtering assets for userId:', user.userId);
      where = { userId: user.userId };
    } else {
      console.log('Admin access - returning all assets');
    }

    const newAssets = await prisma.newAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assetCategory: true,
        department: true,
        employee: true,
        assetCondition: true,
        location: true,
        user: true, // Include user relation
      },
    });

    console.log(`Found ${newAssets.length} assets for ${isAdmin ? 'admin' : 'member'} user`);

    res.status(200).json({
      success: true,
      count: newAssets.length,
      data: newAssets,
    });
  } catch (error) {
    console.error('Error fetching new assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new assets',
      error: error.message,
    });
  }
};

// Get NewAsset by ID
exports.getNewAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    const newAsset = await prisma.newAsset.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        assetCategory: true,
        department: true,
        employee: true,
        assetCondition: true,
        location: true,
        user: true, // Include user relation
      },
    });

    if (!newAsset) {
      return res.status(404).json({
        success: false,
        message: 'New asset not found',
      });
    }

    res.status(200).json({
      success: true,
      data: newAsset,
    });
  } catch (error) {
    console.error('Error fetching new asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new asset',
      error: error.message,
    });
  }
};

// Update NewAsset
exports.updateNewAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      assetCategoryId,
      serialNo,
      departmentId,
      employeeId,
      status,
      assetConditionId,
      purchaseDate,
      warrantyExpiry,
      locationId,
      description,
      userId, // Optional: can update userId
    } = req.body;

    const existing = await prisma.newAsset.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'New asset not found',
      });
    }

    // Validate and check related records if ids are provided
    if (assetCategoryId) {
      const assetCategory = await prisma.assetCategory.findUnique({
        where: { id: parseInt(assetCategoryId, 10) },
      });
      if (!assetCategory) {
        return res
          .status(404)
          .json({ success: false, message: 'AssetCategory not found' });
      }
    }

    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: parseInt(departmentId, 10) },
      });
      if (!department) {
        return res
          .status(404)
          .json({ success: false, message: 'Department not found' });
      }
    }

    if (employeeId) {
      const employee = await prisma.employeeList.findUnique({
        where: { id: parseInt(employeeId, 10) },
      });
      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: 'Employee not found' });
      }
    }

    if (assetConditionId) {
      const assetCondition = await prisma.assetCondition.findUnique({
        where: { id: parseInt(assetConditionId, 10) },
      });
      if (!assetCondition) {
        return res
          .status(404)
          .json({ success: false, message: 'AssetCondition not found' });
      }
    }

    // When updating, locationId continues to refer to a City record
    if (locationId) {
      const city = await prisma.city.findUnique({
        where: { id: parseInt(locationId, 10) },
      });
      if (!city) {
        return res
          .status(404)
          .json({ success: false, message: 'City not found' });
      }
    }

    // Image
    const imagePath = req.file
      ? getImageUrl(req.file.filename)
      : existing.image;

    // Parse dates
    const parsedPurchaseDate =
      purchaseDate !== undefined ? new Date(purchaseDate) : existing.purchaseDate;
    const parsedWarrantyExpiry =
      warrantyExpiry !== undefined
        ? new Date(warrantyExpiry)
        : existing.warrantyExpiry;

    const updated = await prisma.newAsset.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name !== undefined ? name : existing.name,
        serialNo: serialNo !== undefined ? serialNo : existing.serialNo,
        status: status !== undefined ? status : existing.status,
        description:
          description !== undefined ? description : existing.description,
        image: imagePath,
        purchaseDate: parsedPurchaseDate,
        warrantyExpiry: parsedWarrantyExpiry,
        assetCategoryId:
          assetCategoryId !== undefined
            ? parseInt(assetCategoryId, 10)
            : existing.assetCategoryId,
        departmentId:
          departmentId !== undefined
            ? parseInt(departmentId, 10)
            : existing.departmentId,
        employeeId:
          employeeId !== undefined ? parseInt(employeeId, 10) : existing.employeeId,
        assetConditionId:
          assetConditionId !== undefined
            ? parseInt(assetConditionId, 10)
            : existing.assetConditionId,
        locationId:
          locationId !== undefined ? parseInt(locationId, 10) : existing.locationId,
        userId:
          userId !== undefined ? userId : existing.userId,
      },
      include: {
        assetCategory: true,
        department: true,
        employee: true,
        assetCondition: true,
        location: true,
        user: true, // Include user relation
      },
    });

    res.status(200).json({
      success: true,
      message: 'New asset updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating new asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update new asset',
      error: error.message,
    });
  }
};

// Delete NewAsset
exports.deleteNewAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.newAsset.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'New asset not found',
      });
    }

    await prisma.newAsset.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({
      success: true,
      message: 'New asset deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting new asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete new asset',
      error: error.message,
    });
  }
};


