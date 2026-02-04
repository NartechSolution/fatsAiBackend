const prisma = require('../prisma/client');
const { upload, getImageUrl } = require('../utils/uploadUtils');

// Middleware for handling file uploads (image field)
exports.uploadNewAssetImage = upload.single('image');

// Create a new NewAsset
exports.createNewAsset = async (req, res) => {
  try {
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

    const location = await prisma.location.findUnique({
      where: { id: parseInt(locationId, 10) },
    });
    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: 'Location not found' });
    }

    // Image
    const imagePath = req.file ? getImageUrl(req.file.filename) : null;

    // Parse dates
    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    const parsedWarrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;

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
      },
      include: {
        assetCategory: true,
        department: true,
        employee: true,
        assetCondition: true,
        location: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'New asset created successfully',
      data: newAsset,
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
    const user = req.user || {};

    // Determine if the requester is an admin (based on admin JWT payload)
    const isAdmin = user.role === 'admin' || !!user.adminId;

    let where = {};

    // For non-admin users, restrict to their own assets
    if (!isAdmin) {
      if (!user.email) {
        return res.status(400).json({
          success: false,
          message: 'User email not found in token. Cannot determine employee.',
        });
      }

      // Find the employee record that matches the logged-in user's email
      const employee = await prisma.employeeList.findFirst({
        where: { email: user.email },
      });

      // If there is no matching employee, return an empty list (no assigned assets)
      if (!employee) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      where = { employeeId: employee.id };
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
      },
    });

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

    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: parseInt(locationId, 10) },
      });
      if (!location) {
        return res
          .status(404)
          .json({ success: false, message: 'Location not found' });
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
      },
      include: {
        assetCategory: true,
        department: true,
        employee: true,
        assetCondition: true,
        location: true,
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


