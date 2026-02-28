const prisma = require('../prisma/client');
const { upload, getImageUrl } = require('../utils/uploadUtils');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Shared include for NewAsset relations (Country, State, City, AssetCategory, AssetBrand, etc.)
const newAssetInclude = {
  assetCategory: true,
  assetBrand: true,
  department: true,
  employee: true,
  assetCondition: true,
  country: true,
  state: true,
  location: true, // City
  building: true,
  floor: true,
  user: true,
};

// Middleware for handling file uploads (image field)
exports.uploadNewAssetImage = upload.single('image');

/**
 * Given a serial number string (e.g. "SN232332"), return the next one by incrementing the trailing numeric part.
 * Examples: "SN232332" -> "SN232333"; "ABC99" -> "ABC100". If no trailing digits, appends "1", "2", etc.
 */
function getNextSerialNo(serialNo) {
  if (!serialNo || typeof serialNo !== 'string') return 'SN1';
  const s = String(serialNo).trim();
  const match = s.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    return `${prefix}${num + 1}`;
  }
  return `${s}1`;
}

// Create a new NewAsset (or multiple when quantity > 1, with incrementing serial numbers)
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
      countryId,
      stateId,
      assetBrandId,
      buildingId,
      floorId,
      description,
      userId,
      // Optional further parameters (no relations)
      brandModel,
      quantity,
      zoneArea,
      DeptCode,
      bussinessUnit,
      buildingName,
      buildingAddress,
      buidlingNumber,
    } = req.body;

    // Number of assets to create (same data, incrementing serial numbers). Default 1.
    const quantityCount = Math.max(1, parseInt(quantity, 10) || 1);

    // Auto-generate serial number if not provided or empty
    let finalSerialNo = serialNo;
    if (
      finalSerialNo === undefined ||
      finalSerialNo === null ||
      String(finalSerialNo).trim() === ''
    ) {
      // Generate SN followed by 8 random digits, e.g. SN10111012
      const randomPart = Math.floor(10000000 + Math.random() * 90000000);
      finalSerialNo = `SN${randomPart}`;
    }

    // Build list of serial numbers: first = finalSerialNo, then increment for each additional asset
    const serialNumbers = [];
    let currentSerial = finalSerialNo;
    for (let i = 0; i < quantityCount; i++) {
      serialNumbers.push(currentSerial);
      currentSerial = getNextSerialNo(currentSerial);
    }

    // Check related records only when IDs are provided
    if (assetCategoryId != null && assetCategoryId !== '') {
      const assetCategory = await prisma.assetCategory.findUnique({
        where: { id: parseInt(assetCategoryId, 10) },
      });
      if (!assetCategory) {
        return res
          .status(404)
          .json({ success: false, message: 'AssetCategory not found' });
      }
    }

    if (departmentId != null && departmentId !== '') {
      const department = await prisma.department.findUnique({
        where: { id: parseInt(departmentId, 10) },
      });
      if (!department) {
        return res
          .status(404)
          .json({ success: false, message: 'Department not found' });
      }
    }

    if (employeeId != null && employeeId !== '') {
      const employee = await prisma.employeeList.findUnique({
        where: { id: parseInt(employeeId, 10) },
      });
      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: 'Employee not found' });
      }
    }

    if (assetConditionId != null && assetConditionId !== '') {
      const assetCondition = await prisma.assetCondition.findUnique({
        where: { id: parseInt(assetConditionId, 10) },
      });
      if (!assetCondition) {
        return res
          .status(404)
          .json({ success: false, message: 'AssetCondition not found' });
      }
    }

    // locationId now refers to a City record
    if (locationId != null && locationId !== '') {
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
    }

    // Optional: validate countryId, stateId, assetBrandId if provided
    if (countryId != null && countryId !== '') {
      const country = await prisma.country.findUnique({
        where: { id: parseInt(countryId, 10) },
      });
      if (!country) {
        return res.status(400).json({
          success: false,
          message: `Country with id ${countryId} not found`,
        });
      }
    }
    if (stateId != null && stateId !== '') {
      const state = await prisma.state.findUnique({
        where: { id: parseInt(stateId, 10) },
      });
      if (!state) {
        return res.status(400).json({
          success: false,
          message: `State with id ${stateId} not found`,
        });
      }
    }
    if (assetBrandId != null && assetBrandId !== '') {
      const assetBrand = await prisma.assetBrand.findUnique({
        where: { id: parseInt(assetBrandId, 10) },
      });
      if (!assetBrand) {
        return res.status(400).json({
          success: false,
          message: `AssetBrand with id ${assetBrandId} not found`,
        });
      }
    }

    if (buildingId != null && buildingId !== '') {
      const building = await prisma.building.findUnique({
        where: { id: parseInt(buildingId, 10) },
      });
      if (!building) {
        return res.status(400).json({
          success: false,
          message: `Building with id ${buildingId} not found`,
        });
      }
    }

    if (floorId != null && floorId !== '') {
      const floor = await prisma.floor.findUnique({
        where: { id: parseInt(floorId, 10) },
      });
      if (!floor) {
        return res.status(400).json({
          success: false,
          message: `Floor with id ${floorId} not found`,
        });
      }
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

    // Build relation connects (Prisma SQL Server may require connect over scalar IDs)
    const connectAssetCategory = assetCategoryId != null && assetCategoryId !== '' ? { connect: { id: parseInt(assetCategoryId, 10) } } : undefined;
    const connectDepartment = departmentId != null && departmentId !== '' ? { connect: { id: parseInt(departmentId, 10) } } : undefined;
    const connectEmployee = employeeId != null && employeeId !== '' ? { connect: { id: parseInt(employeeId, 10) } } : undefined;
    const connectAssetCondition = assetConditionId != null && assetConditionId !== '' ? { connect: { id: parseInt(assetConditionId, 10) } } : undefined;
    const connectLocation = locationId != null && locationId !== '' ? { connect: { id: parseInt(locationId, 10) } } : undefined;
    const connectCountry = countryId != null && countryId !== '' ? { connect: { id: parseInt(countryId, 10) } } : undefined;
    const connectState = stateId != null && stateId !== '' ? { connect: { id: parseInt(stateId, 10) } } : undefined;
    const connectAssetBrand = assetBrandId != null && assetBrandId !== '' ? { connect: { id: parseInt(assetBrandId, 10) } } : undefined;
    const connectBuilding = buildingId != null && buildingId !== '' ? { connect: { id: parseInt(buildingId, 10) } } : undefined;
    const connectFloor = floorId != null && floorId !== '' ? { connect: { id: parseInt(floorId, 10) } } : undefined;
    const connectUser = finalUserId ? { connect: { id: finalUserId } } : undefined;

    // When creating multiple assets (quantity > 1), each record is one unit so store quantity as 1 per asset
    const quantityForRecord = quantityCount > 1 ? 1 : (quantity === undefined ? undefined : (quantity === '' || quantity == null ? null : parseInt(quantity, 10)));

    const createdAssets = [];
    for (let i = 0; i < quantityCount; i++) {
      const newAsset = await prisma.newAsset.create({
        data: {
          name: name || null,
          serialNo: serialNumbers[i] || null,
          status: status || null,
          description: description || null,
          image: imagePath,
          purchaseDate: parsedPurchaseDate,
          warrantyExpiry: parsedWarrantyExpiry,
          ...(connectAssetCategory && { assetCategory: connectAssetCategory }),
          ...(connectDepartment && { department: connectDepartment }),
          ...(connectEmployee && { employee: connectEmployee }),
          ...(connectAssetCondition && { assetCondition: connectAssetCondition }),
          ...(connectLocation && { location: connectLocation }),
          ...(connectUser && { user: connectUser }),
          ...(connectCountry && { country: connectCountry }),
          ...(connectState && { state: connectState }),
          ...(connectAssetBrand && { assetBrand: connectAssetBrand }),
          ...(connectBuilding && { building: connectBuilding }),
          ...(connectFloor && { floor: connectFloor }),
          ...(brandModel !== undefined ? { brandModel: brandModel || null } : {}),
          ...(quantityForRecord !== undefined ? { quantity: quantityForRecord } : {}),
          ...(zoneArea !== undefined ? { zoneArea: zoneArea || null } : {}),
          ...(DeptCode !== undefined ? { DeptCode: DeptCode || null } : {}),
          ...(bussinessUnit !== undefined ? { bussinessUnit: bussinessUnit || null } : {}),
          ...(buildingName !== undefined ? { buildingName: buildingName || null } : {}),
          ...(buildingAddress !== undefined ? { buildingAddress: buildingAddress || null } : {}),
          ...(buidlingNumber !== undefined ? { buidlingNumber: buidlingNumber || null } : {}),
        },
      });
      createdAssets.push(newAsset);
    }

    // Fetch all created assets with relations for response
    const newAssetsWithRelations = await prisma.newAsset.findMany({
      where: { id: { in: createdAssets.map((a) => a.id) } },
      include: newAssetInclude,
      orderBy: { id: 'asc' },
    });

    res.status(201).json({
      success: true,
      message: quantityCount > 1
        ? `${quantityCount} new assets created successfully`
        : 'New asset created successfully',
      count: quantityCount,
      data: newAssetsWithRelations,
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

    // No strictly required columns now; previously name, assetCategoryId, serialNo, departmentId, employeeId, status, assetConditionId, locationId

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

    // Preload valid foreign key IDs to avoid FK constraint errors
    const [
      assetCategories,
      departments,
      employees,
      assetConditions,
      cities,
      users,
      countries,
      states,
      assetBrands,
    ] = await Promise.all([
      prisma.assetCategory.findMany({ select: { id: true } }),
      prisma.department.findMany({ select: { id: true } }),
      prisma.employeeList.findMany({ select: { id: true } }),
      prisma.assetCondition.findMany({ select: { id: true } }),
      prisma.city.findMany({ select: { id: true } }),
      prisma.user.findMany({ select: { id: true } }),
      prisma.country.findMany({ select: { id: true } }),
      prisma.state.findMany({ select: { id: true } }),
      prisma.assetBrand.findMany({ select: { id: true } }),
    ]);

    const validAssetCategoryIds = new Set(assetCategories.map((a) => a.id));
    const validDepartmentIds = new Set(departments.map((d) => d.id));
    const validEmployeeIds = new Set(employees.map((e) => e.id));
    const validAssetConditionIds = new Set(assetConditions.map((c) => c.id));
    const validLocationIds = new Set(cities.map((c) => c.id));
    const validUserIds = new Set(users.map((u) => u.id));
    const validCountryIds = new Set(countries.map((c) => c.id));
    const validStateIds = new Set(states.map((s) => s.id));
    const validAssetBrandIds = new Set(assetBrands.map((b) => b.id));

    const assetsToCreate = [];
    const rowErrors = [];

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
      const countryId = parseIntSafe(getCellValue(row, 'countryid'));
      const stateId = parseIntSafe(getCellValue(row, 'stateid'));
      const assetBrandId = parseIntSafe(getCellValue(row, 'assetbrandid'));
      const description = getCellValue(row, 'description');
      const brandModel = getCellValue(row, 'brandmodel');
      const quantity = parseIntSafe(getCellValue(row, 'quantity'));
      const zoneArea = getCellValue(row, 'zonearea');
      const DeptCode = getCellValue(row, 'deptcode');
      const bussinessUnit = getCellValue(row, 'bussinessunit');
      const buildingName = getCellValue(row, 'buildingname');
      const buildingAddress = getCellValue(row, 'buildingaddress');
      const buidlingNumber = getCellValue(row, 'buidlingnumber');
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

      // Validate foreign keys
      let rowInvalid = false;
      if (assetCategoryId !== null && !validAssetCategoryIds.has(assetCategoryId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'assetCategoryId',
          value: assetCategoryId,
          reason: `AssetCategory with id ${assetCategoryId} not found`,
        });
      }
      if (departmentId !== null && !validDepartmentIds.has(departmentId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'departmentId',
          value: departmentId,
          reason: `Department with id ${departmentId} not found`,
        });
      }
      if (employeeId !== null && !validEmployeeIds.has(employeeId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'employeeId',
          value: employeeId,
          reason: `Employee with id ${employeeId} not found`,
        });
      }
      if (assetConditionId !== null && !validAssetConditionIds.has(assetConditionId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'assetConditionId',
          value: assetConditionId,
          reason: `AssetCondition with id ${assetConditionId} not found`,
        });
      }
      if (locationId !== null && !validLocationIds.has(locationId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'locationId',
          value: locationId,
          reason: `City (location) with id ${locationId} not found`,
        });
      }
      if (rowUserId && !validUserIds.has(rowUserId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'userId',
          value: rowUserId,
          reason: `User with id ${rowUserId} not found`,
        });
      }
      if (countryId !== null && !validCountryIds.has(countryId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'countryId',
          value: countryId,
          reason: `Country with id ${countryId} not found`,
        });
      }
      if (stateId !== null && !validStateIds.has(stateId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'stateId',
          value: stateId,
          reason: `State with id ${stateId} not found`,
        });
      }
      if (assetBrandId !== null && !validAssetBrandIds.has(assetBrandId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'assetBrandId',
          value: assetBrandId,
          reason: `AssetBrand with id ${assetBrandId} not found`,
        });
      }

      if (rowInvalid) {
        // Skip this row due to invalid foreign keys
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
        ...(countryId !== null ? { countryId } : {}),
        ...(stateId !== null ? { stateId } : {}),
        ...(assetBrandId !== null ? { assetBrandId } : {}),
        ...(brandModel !== undefined && brandModel !== null && brandModel !== '' ? { brandModel: String(brandModel) } : {}),
        ...(quantity !== null ? { quantity } : {}),
        ...(zoneArea !== undefined && zoneArea !== null && zoneArea !== '' ? { zoneArea: String(zoneArea) } : {}),
        ...(DeptCode !== undefined && DeptCode !== null && DeptCode !== '' ? { DeptCode: String(DeptCode) } : {}),
        ...(bussinessUnit !== undefined && bussinessUnit !== null && bussinessUnit !== '' ? { bussinessUnit: String(bussinessUnit) } : {}),
        ...(buildingName !== undefined && buildingName !== null && buildingName !== '' ? { buildingName: String(buildingName) } : {}),
        ...(buildingAddress !== undefined && buildingAddress !== null && buildingAddress !== '' ? { buildingAddress: String(buildingAddress) } : {}),
        ...(buidlingNumber !== undefined && buidlingNumber !== null && buidlingNumber !== '' ? { buidlingNumber: String(buidlingNumber) } : {}),
      });
    });

    if (assetsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No valid asset rows found in Excel file. Please ensure required columns are filled and foreign keys are valid.',
        rowErrors,
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
        rowsSkipped: rowErrors.length,
        rowErrors,
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
      include: newAssetInclude,
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
      include: newAssetInclude,
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
      countryId,
      stateId,
      assetBrandId,
      buildingId,
      floorId,
      description,
      userId,
      brandModel,
      quantity,
      zoneArea,
      DeptCode,
      bussinessUnit,
      buildingName,
      buildingAddress,
      buidlingNumber,
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

    if (countryId !== undefined && countryId !== null && countryId !== '') {
      const country = await prisma.country.findUnique({
        where: { id: parseInt(countryId, 10) },
      });
      if (!country) {
        return res.status(400).json({
          success: false,
          message: `Country with id ${countryId} not found`,
        });
      }
    }
    if (stateId !== undefined && stateId !== null && stateId !== '') {
      const state = await prisma.state.findUnique({
        where: { id: parseInt(stateId, 10) },
      });
      if (!state) {
        return res.status(400).json({
          success: false,
          message: `State with id ${stateId} not found`,
        });
      }
    }
    if (assetBrandId !== undefined && assetBrandId !== null && assetBrandId !== '') {
      const assetBrand = await prisma.assetBrand.findUnique({
        where: { id: parseInt(assetBrandId, 10) },
      });
      if (!assetBrand) {
        return res.status(400).json({
          success: false,
          message: `AssetBrand with id ${assetBrandId} not found`,
        });
      }
    }

    if (buildingId !== undefined && buildingId !== null && buildingId !== '') {
      const building = await prisma.building.findUnique({
        where: { id: parseInt(buildingId, 10) },
      });
      if (!building) {
        return res.status(400).json({
          success: false,
          message: `Building with id ${buildingId} not found`,
        });
      }
    }

    if (floorId !== undefined && floorId !== null && floorId !== '') {
      const floor = await prisma.floor.findUnique({
        where: { id: parseInt(floorId, 10) },
      });
      if (!floor) {
        return res.status(400).json({
          success: false,
          message: `Floor with id ${floorId} not found`,
        });
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
        ...(countryId !== undefined
          ? { countryId: countryId == null || countryId === '' ? null : parseInt(countryId, 10) }
          : {}),
        ...(stateId !== undefined
          ? { stateId: stateId == null || stateId === '' ? null : parseInt(stateId, 10) }
          : {}),
        ...(assetBrandId !== undefined
          ? { assetBrandId: assetBrandId == null || assetBrandId === '' ? null : parseInt(assetBrandId, 10) }
          : {}),
        ...(buildingId !== undefined
          ? { buildingId: buildingId == null || buildingId === '' ? null : parseInt(buildingId, 10) }
          : {}),
        ...(floorId !== undefined
          ? { floorId: floorId == null || floorId === '' ? null : parseInt(floorId, 10) }
          : {}),
        ...(brandModel !== undefined ? { brandModel: brandModel || null } : {}),
        ...(quantity !== undefined ? { quantity: quantity === '' || quantity == null ? null : parseInt(quantity, 10) } : {}),
        ...(zoneArea !== undefined ? { zoneArea: zoneArea || null } : {}),
        ...(DeptCode !== undefined ? { DeptCode: DeptCode || null } : {}),
        ...(bussinessUnit !== undefined ? { bussinessUnit: bussinessUnit || null } : {}),
        ...(buildingName !== undefined ? { buildingName: buildingName || null } : {}),
        ...(buildingAddress !== undefined ? { buildingAddress: buildingAddress || null } : {}),
        ...(buidlingNumber !== undefined ? { buidlingNumber: buidlingNumber || null } : {}),
      },
      include: newAssetInclude,
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


