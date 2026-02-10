const prisma = require('../prisma/client');
const { upload, getImageUrl } = require('../utils/uploadUtils');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

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

// Helper to normalize Excel header names (case/space/underscore insensitive)
const normalizeHeader = (header) => {
  if (!header) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[\s_]/g, '');
};

// Helper to safely parse integer IDs
const parseIntSafe = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
};

// Helper to parse date cells from Excel
const parseDateCell = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && value.text) {
    const d = new Date(value.text);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// Bulk import NewAssets from an uploaded Excel file
// POST /api/new-assets/import
// Expects multipart/form-data with field: file (XLS/XLSX/CSV)
exports.importNewAssetsFromExcel = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const user = req.user || req.admin || {};
    const isAdmin = user.role === 'admin' || !!user.adminId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required in "file" field',
      });
    }

    uploadedFilePath = req.file.path;

    const workbook = new ExcelJS.Workbook();
    const ext = path.extname(uploadedFilePath || '').toLowerCase();

    // Support both Excel workbooks and CSV files
    if (ext === '.csv') {
      await workbook.csv.readFile(uploadedFilePath);
    } else {
      await workbook.xlsx.readFile(uploadedFilePath);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: 'No worksheet found in uploaded file',
      });
    }

    // Build header map from first row
    const headerRow = worksheet.getRow(1);
    const headerMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const normalized = normalizeHeader(cell.value);
      if (normalized) {
        headerMap[normalized] = colNumber;
      }
    });

    // Required columns (normalized names)
    const requiredHeaders = [
      'name',
      'assetcategoryid',
      'serialno',
      'departmentid',
      'employeeid',
      'status',
      'assetconditionid',
      'locationid',
    ];

    const missingHeaders = requiredHeaders.filter(
      (key) => !headerMap[key]
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required columns in Excel header row. Required (case-insensitive, spaces/underscores ignored): name, assetCategoryId, serialNo, departmentId, employeeId, status, assetConditionId, locationId',
        missingHeaders,
      });
    }

    const getCellValue = (row, normalizedKey) => {
      const col = headerMap[normalizedKey];
      if (!col) return null;
      const cell = row.getCell(col);
      const value = cell.value;
      if (value && typeof value === 'object' && value.text) {
        return value.text;
      }
      return value;
    };

    const assetsToCreate = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const name = getCellValue(row, 'name');
      const serialNo = getCellValue(row, 'serialno');

      // Skip completely empty or invalid rows
      if (!name && !serialNo) {
        return;
      }

      const assetCategoryId = parseIntSafe(
        getCellValue(row, 'assetcategoryid')
      );
      const departmentId = parseIntSafe(
        getCellValue(row, 'departmentid')
      );
      const employeeId = parseIntSafe(
        getCellValue(row, 'employeeid')
      );
      const status = getCellValue(row, 'status');
      const assetConditionId = parseIntSafe(
        getCellValue(row, 'assetconditionid')
      );
      const locationId = parseIntSafe(
        getCellValue(row, 'locationid')
      );
      const description = getCellValue(row, 'description');
      const purchaseDate = parseDateCell(
        getCellValue(row, 'purchasedate')
      );
      const warrantyExpiry = parseDateCell(
        getCellValue(row, 'warrantyexpiry')
      );

      // For admins, allow userId column; for members, always use their own userId
      let rowUserId = null;
      if (isAdmin) {
        const userIdCell = getCellValue(row, 'userid');
        if (userIdCell !== null && userIdCell !== undefined && userIdCell !== '') {
          rowUserId = userIdCell;
        }
      } else if (user.userId) {
        rowUserId = user.userId;
      }

      // Basic per-row validation of required fields
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
        // Skip invalid/incomplete row
        return;
      }

      assetsToCreate.push({
        name,
        serialNo,
        status,
        description: description || null,
        image: null,
        purchaseDate,
        warrantyExpiry,
        assetCategoryId,
        departmentId,
        employeeId,
        assetConditionId,
        locationId,
        userId: rowUserId,
      });
    });

    if (assetsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No valid asset rows found in Excel file. Please ensure required columns are filled.',
      });
    }

    const result = await prisma.newAsset.createMany({
      data: assetsToCreate,
    });

    return res.status(201).json({
      success: true,
      message: 'New assets imported successfully from Excel',
      summary: {
        rowsProcessed: assetsToCreate.length,
        rowsInserted: result.count,
      },
    });
  } catch (error) {
    console.error('Error importing new assets from Excel:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import new assets from Excel',
      error: error.message,
    });
  } finally {
    // Clean up uploaded file
    if (uploadedFilePath) {
      fs.unlink(uploadedFilePath, () => {});
    }
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


