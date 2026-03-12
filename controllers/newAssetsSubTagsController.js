const prisma = require('../prisma/client');
const { upload, getImageUrl } = require('../utils/uploadUtils');

// Shared include for newAssetsSubTags relations (same as NewAsset)
const newAssetsSubTagsInclude = {
  assetCategory: true,
  assetBrand: true,
  department: true,
  employee: true,
  assetCondition: true,
  country: true,
  state: true,
  location: true,
  building: true,
  floor: true,
  user: true,
  newAsset: true,
};

// Middleware for handling file uploads (image field)
exports.uploadNewAssetsSubTagsImage = upload.single('image');

// Helper to increment serial numbers
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

// Create a new newAssetsSubTags record (or multiple when quantity > 1)
exports.createNewAssetsSubTags = async (req, res) => {
  try {
    const user = req.user || req.admin || {};
    const isAdmin = user.role === 'admin' || !!user.adminId;

    const {
      newassetId,
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

    if (!newassetId) {
      return res.status(400).json({
        success: false,
        message: 'newassetId is required to create sub tag',
      });
    }

    const parentAsset = await prisma.newAsset.findUnique({
      where: { id: parseInt(newassetId, 10) },
    });

    if (!parentAsset) {
      return res.status(404).json({
        success: false,
        message: 'Parent NewAsset not found',
      });
    }

    const quantityCount = Math.max(1, parseInt(quantity, 10) || 1);

    let finalSerialNo = serialNo;
    if (
      finalSerialNo === undefined ||
      finalSerialNo === null ||
      String(finalSerialNo).trim() === ''
    ) {
      const randomPart = Math.floor(10000000 + Math.random() * 90000000);
      finalSerialNo = `SN${randomPart}`;
    }

    const serialNumbers = [];
    let currentSerial = finalSerialNo;
    for (let i = 0; i < quantityCount; i++) {
      serialNumbers.push(currentSerial);
      currentSerial = getNextSerialNo(currentSerial);
    }

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

    if (locationId != null && locationId !== '') {
      const city = await prisma.city.findUnique({
        where: { id: parseInt(locationId, 10) },
      });
      if (!city) {
        return res.status(404).json({
          success: false,
          message: `City with id ${locationId} not found. Please ensure the city exists before creating an asset.`,
        });
      }
    }

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

    const imagePath = req.file ? getImageUrl(req.file.filename) : null;

    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    const parsedWarrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;

    let finalUserId = userId || null;
    if (!isAdmin && user.userId) {
      finalUserId = user.userId;
    }

    const connectAssetCategory =
      assetCategoryId != null && assetCategoryId !== ''
        ? { connect: { id: parseInt(assetCategoryId, 10) } }
        : undefined;
    const connectDepartment =
      departmentId != null && departmentId !== ''
        ? { connect: { id: parseInt(departmentId, 10) } }
        : undefined;
    const connectEmployee =
      employeeId != null && employeeId !== ''
        ? { connect: { id: parseInt(employeeId, 10) } }
        : undefined;
    const connectAssetCondition =
      assetConditionId != null && assetConditionId !== ''
        ? { connect: { id: parseInt(assetConditionId, 10) } }
        : undefined;
    const connectLocation =
      locationId != null && locationId !== ''
        ? { connect: { id: parseInt(locationId, 10) } }
        : undefined;
    const connectCountry =
      countryId != null && countryId !== ''
        ? { connect: { id: parseInt(countryId, 10) } }
        : undefined;
    const connectState =
      stateId != null && stateId !== ''
        ? { connect: { id: parseInt(stateId, 10) } }
        : undefined;
    const connectAssetBrand =
      assetBrandId != null && assetBrandId !== ''
        ? { connect: { id: parseInt(assetBrandId, 10) } }
        : undefined;
    const connectBuilding =
      buildingId != null && buildingId !== ''
        ? { connect: { id: parseInt(buildingId, 10) } }
        : undefined;
    const connectFloor =
      floorId != null && floorId !== ''
        ? { connect: { id: parseInt(floorId, 10) } }
        : undefined;
    const connectUser = finalUserId ? { connect: { id: finalUserId } } : undefined;

    const quantityForRecord =
      quantityCount > 1
        ? 1
        : quantity === undefined
        ? undefined
        : quantity === '' || quantity == null
        ? null
        : parseInt(quantity, 10);

    const created = [];
    for (let i = 0; i < quantityCount; i++) {
      const record = await prisma.newAssetsSubTags.create({
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
          ...(bussinessUnit !== undefined
            ? { bussinessUnit: bussinessUnit || null }
            : {}),
          ...(buildingName !== undefined
            ? { buildingName: buildingName || null }
            : {}),
          ...(buildingAddress !== undefined
            ? { buildingAddress: buildingAddress || null }
            : {}),
          ...(buidlingNumber !== undefined
            ? { buidlingNumber: buidlingNumber || null }
            : {}),
          newAsset: { connect: { id: parseInt(newassetId, 10) } },
        },
      });
      created.push(record);
    }

    const withRelations = await prisma.newAssetsSubTags.findMany({
      where: { id: { in: created.map((a) => a.id) } },
      include: newAssetsSubTagsInclude,
      orderBy: { id: 'asc' },
    });

    return res.status(201).json({
      success: true,
      message:
        quantityCount > 1
          ? `${quantityCount} newAssetsSubTags created successfully`
          : 'newAssetsSubTags created successfully',
      count: quantityCount,
      data: withRelations,
    });
  } catch (error) {
    console.error('Error creating newAssetsSubTags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create newAssetsSubTags',
      error: error.message,
    });
  }
};

// Get all newAssetsSubTags (optionally filter by parent newassetId)
exports.getAllNewAssetsSubTags = async (req, res) => {
  try {
    const { newassetId } = req.query;

    const where = {};
    if (newassetId) {
      where.newassetId = parseInt(newassetId, 10);
    }

    const items = await prisma.newAssetsSubTags.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: newAssetsSubTagsInclude,
    });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching newAssetsSubTags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch newAssetsSubTags',
      error: error.message,
    });
  }
};

// Get single newAssetsSubTags by ID
exports.getNewAssetsSubTagsById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.newAssetsSubTags.findUnique({
      where: { id: parseInt(id, 10) },
      include: newAssetsSubTagsInclude,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'newAssetsSubTags not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching newAssetsSubTags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch newAssetsSubTags',
      error: error.message,
    });
  }
};

// Update newAssetsSubTags
exports.updateNewAssetsSubTags = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      newassetId,
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

    const existing = await prisma.newAssetsSubTags.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'newAssetsSubTags not found',
      });
    }

    if (newassetId) {
      const parentAsset = await prisma.newAsset.findUnique({
        where: { id: parseInt(newassetId, 10) },
      });
      if (!parentAsset) {
        return res.status(404).json({
          success: false,
          message: 'Parent NewAsset not found',
        });
      }
    }

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

    const imagePath = req.file
      ? getImageUrl(req.file.filename)
      : existing.image;

    const parsedPurchaseDate =
      purchaseDate !== undefined ? new Date(purchaseDate) : existing.purchaseDate;
    const parsedWarrantyExpiry =
      warrantyExpiry !== undefined
        ? new Date(warrantyExpiry)
        : existing.warrantyExpiry;

    const updated = await prisma.newAssetsSubTags.update({
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
        userId: userId !== undefined ? userId : existing.userId,
        ...(countryId !== undefined
          ? {
              countryId:
                countryId == null || countryId === ''
                  ? null
                  : parseInt(countryId, 10),
            }
          : {}),
        ...(stateId !== undefined
          ? {
              stateId:
                stateId == null || stateId === ''
                  ? null
                  : parseInt(stateId, 10),
            }
          : {}),
        ...(assetBrandId !== undefined
          ? {
              assetBrandId:
                assetBrandId == null || assetBrandId === ''
                  ? null
                  : parseInt(assetBrandId, 10),
            }
          : {}),
        ...(buildingId !== undefined
          ? {
              buildingId:
                buildingId == null || buildingId === ''
                  ? null
                  : parseInt(buildingId, 10),
            }
          : {}),
        ...(floorId !== undefined
          ? {
              floorId:
                floorId == null || floorId === ''
                  ? null
                  : parseInt(floorId, 10),
            }
          : {}),
        ...(brandModel !== undefined ? { brandModel: brandModel || null } : {}),
        ...(quantity !== undefined
          ? {
              quantity:
                quantity === '' || quantity == null ? null : parseInt(quantity, 10),
            }
          : {}),
        ...(zoneArea !== undefined ? { zoneArea: zoneArea || null } : {}),
        ...(DeptCode !== undefined ? { DeptCode: DeptCode || null } : {}),
        ...(bussinessUnit !== undefined
          ? { bussinessUnit: bussinessUnit || null }
          : {}),
        ...(buildingName !== undefined
          ? { buildingName: buildingName || null }
          : {}),
        ...(buildingAddress !== undefined
          ? { buildingAddress: buildingAddress || null }
          : {}),
        ...(buidlingNumber !== undefined
          ? { buidlingNumber: buidlingNumber || null }
          : {}),
        ...(newassetId !== undefined
          ? { newassetId: parseInt(newassetId, 10) }
          : {}),
      },
      include: newAssetsSubTagsInclude,
    });

    return res.status(200).json({
      success: true,
      message: 'newAssetsSubTags updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating newAssetsSubTags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update newAssetsSubTags',
      error: error.message,
    });
  }
};

// Delete newAssetsSubTags
exports.deleteNewAssetsSubTags = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.newAssetsSubTags.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'newAssetsSubTags not found',
      });
    }

    await prisma.newAssetsSubTags.delete({
      where: { id: parseInt(id, 10) },
    });

    return res.status(200).json({
      success: true,
      message: 'newAssetsSubTags deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting newAssetsSubTags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete newAssetsSubTags',
      error: error.message,
    });
  }
};

