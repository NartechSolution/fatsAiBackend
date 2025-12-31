const prisma = require('../prisma/client');
const { getImageUrl } = require('../utils/uploadUtils');
const fs = require('fs');
const path = require('path');

// Controller methods for MainCategoryManagement CRUD operations
exports.createMainCategoryManagement = async (req, res) => {
  try {
    const {
      name,
      status,
      slugOrUrl,
      categoryManagementTypeId,
      description,
      parentCategoryId,
      displayOrder,
      tagColor,
      roleVisibility,
      linkedPage,
      seoTitle,
      seoDescription,
      displayLayout,
      textIcon
    } = req.body;

    // Validate required fields
    if (!name || !categoryManagementTypeId) {
      return res.status(400).json({
        error: 'Required fields missing: name and categoryManagementTypeId are required'
      });
    }

    // Check if category management type exists
    const categoryManagementType = await prisma.categoryManagementType.findUnique({
      where: { id: parseInt(categoryManagementTypeId) }
    });

    if (!categoryManagementType) {
      return res.status(404).json({ error: 'Category Management Type not found' });
    }

    // If parentCategoryId is provided, validate it exists
    if (parentCategoryId) {
      const parentCategory = await prisma.mainCategoryManagement.findUnique({
        where: { id: parseInt(parentCategoryId) }
      });

      if (!parentCategory) {
        return res.status(404).json({ error: 'Parent Category not found' });
      }
    }

    // Handle icon file upload
    let iconPath = null;
    if (req.file) {
      iconPath = getImageUrl(req.file.filename);
    }

    // Parse displayOrder to integer with proper validation
    let order = 0;
    if (displayOrder !== undefined && displayOrder !== null && displayOrder !== '') {
      const parsed = parseInt(displayOrder);
      order = isNaN(parsed) ? 0 : parsed;
    }

    // Create new main category management
    const mainCategoryManagement = await prisma.mainCategoryManagement.create({
      data: {
        name,
        status: status || 'active',
        slugOrUrl: slugOrUrl || null,
        categoryManagementTypeId: parseInt(categoryManagementTypeId),
        description: description || null,
        parentCategoryId: parentCategoryId && parentCategoryId !== 'null' && parentCategoryId !== '' ? parseInt(parentCategoryId) : null,
        displayOrder: order,
        icon: iconPath,
        textIcon: textIcon || null,
        tagColor: tagColor || null,
        roleVisibility: roleVisibility || null,
        linkedPage: linkedPage || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        displayLayout: displayLayout || null
      },
      include: {
        categoryManagementType: true,
        parentCategory: {
          select: {
            id: true,
            name: true,
            slugOrUrl: true
          }
        },
        childCategories: {
          select: {
            id: true,
            name: true,
            slugOrUrl: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Main category management created successfully',
      mainCategoryManagement
    });
  } catch (error) {
    console.error('Error creating main category management:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A record with this combination already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllMainCategoryManagements = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const categoryManagementTypeId = req.query.categoryManagementTypeId;
    const parentCategoryId = req.query.parentCategoryId;

    // Build filter object
    const where = {};
    if (status !== undefined) where.status = status;
    if (categoryManagementTypeId !== undefined) {
      where.categoryManagementTypeId = parseInt(categoryManagementTypeId);
    }
    if (parentCategoryId !== undefined) {
      if (parentCategoryId === 'null' || parentCategoryId === null) {
        where.parentCategoryId = null;
      } else {
        where.parentCategoryId = parseInt(parentCategoryId);
      }
    }

    // Get main category managements with pagination, sort by displayOrder and createdAt
    const mainCategoryManagements = await prisma.mainCategoryManagement.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        categoryManagementType: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        parentCategory: {
          select: {
            id: true,
            name: true,
            slugOrUrl: true
          }
        },
        _count: {
          select: {
            childCategories: true
          }
        }
      }
    });

    // Get total count
    const totalItems = await prisma.mainCategoryManagement.count({ where });
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
      mainCategoryManagements
    });
  } catch (error) {
    console.error('Error retrieving main category managements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMainCategoryManagementById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find main category management by ID
    const mainCategoryManagement = await prisma.mainCategoryManagement.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoryManagementType: true,
        parentCategory: {
          select: {
            id: true,
            name: true,
            slugOrUrl: true,
            status: true
          }
        },
        childCategories: {
          select: {
            id: true,
            name: true,
            slugOrUrl: true,
            status: true,
            displayOrder: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!mainCategoryManagement) {
      return res.status(404).json({ message: 'Main category management not found' });
    }

    res.status(200).json(mainCategoryManagement);
  } catch (error) {
    console.error('Error retrieving main category management:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMainCategoryManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      status,
      slugOrUrl,
      categoryManagementTypeId,
      description,
      parentCategoryId,
      displayOrder,
      tagColor,
      roleVisibility,
      linkedPage,
      seoTitle,
      seoDescription,
      displayLayout,
      textIcon
    } = req.body;

    // Check if main category management exists
    const existingMainCategoryManagement = await prisma.mainCategoryManagement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMainCategoryManagement) {
      return res.status(404).json({ message: 'Main category management not found' });
    }

    // Validate category management type if being updated
    if (categoryManagementTypeId) {
      const categoryManagementType = await prisma.categoryManagementType.findUnique({
        where: { id: parseInt(categoryManagementTypeId) }
      });

      if (!categoryManagementType) {
        return res.status(404).json({ error: 'Category Management Type not found' });
      }
    }

    // Validate parent category if being updated
    if (parentCategoryId !== undefined) {
      if (parentCategoryId === null || parentCategoryId === 'null') {
        // Allow setting to null (removing parent)
      } else {
        // Prevent self-reference
        if (parseInt(parentCategoryId) === parseInt(id)) {
          return res.status(400).json({ error: 'Cannot set parent category to itself' });
        }

        const parentCategory = await prisma.mainCategoryManagement.findUnique({
          where: { id: parseInt(parentCategoryId) }
        });

        if (!parentCategory) {
          return res.status(404).json({ error: 'Parent Category not found' });
        }
      }
    }

    // Handle icon file upload
    let iconPath = existingMainCategoryManagement.icon;
    if (req.file) {
      // Delete old icon file if it exists
      if (existingMainCategoryManagement.icon) {
        const oldFilePath = path.join(__dirname, '..', existingMainCategoryManagement.icon.replace(/^\//, ''));
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err && err.code !== 'ENOENT') console.error('Error deleting old file:', err);
          });
        }
      }
      iconPath = getImageUrl(req.file.filename);
    }

    // Update main category management
    const updatedMainCategoryManagement = await prisma.mainCategoryManagement.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : existingMainCategoryManagement.name,
        status: status !== undefined ? status : existingMainCategoryManagement.status,
        slugOrUrl: slugOrUrl !== undefined ? (slugOrUrl || null) : existingMainCategoryManagement.slugOrUrl,
        categoryManagementTypeId: categoryManagementTypeId !== undefined
          ? parseInt(categoryManagementTypeId)
          : existingMainCategoryManagement.categoryManagementTypeId,
        description: description !== undefined ? (description || null) : existingMainCategoryManagement.description,
        parentCategoryId: parentCategoryId !== undefined
          ? (parentCategoryId === null || parentCategoryId === 'null' || parentCategoryId === '' ? null : parseInt(parentCategoryId))
          : existingMainCategoryManagement.parentCategoryId,
        displayOrder: displayOrder !== undefined 
          ? (displayOrder === null || displayOrder === '' ? existingMainCategoryManagement.displayOrder : (isNaN(parseInt(displayOrder)) ? existingMainCategoryManagement.displayOrder : parseInt(displayOrder)))
          : existingMainCategoryManagement.displayOrder,
        icon: iconPath,
        textIcon: textIcon !== undefined ? (textIcon || null) : existingMainCategoryManagement.textIcon,
        tagColor: tagColor !== undefined ? (tagColor || null) : existingMainCategoryManagement.tagColor,
        roleVisibility: roleVisibility !== undefined ? (roleVisibility || null) : existingMainCategoryManagement.roleVisibility,
        linkedPage: linkedPage !== undefined ? (linkedPage || null) : existingMainCategoryManagement.linkedPage,
        seoTitle: seoTitle !== undefined ? (seoTitle || null) : existingMainCategoryManagement.seoTitle,
        seoDescription: seoDescription !== undefined ? (seoDescription || null) : existingMainCategoryManagement.seoDescription,
        displayLayout: displayLayout !== undefined ? (displayLayout || null) : existingMainCategoryManagement.displayLayout
      },
      include: {
        categoryManagementType: true,
        parentCategory: {
          select: {
            id: true,
            name: true,
            slugOrUrl: true
          }
        },
        childCategories: {
          select: {
            id: true,
            name: true,
            slugOrUrl: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Main category management updated successfully',
      mainCategoryManagement: updatedMainCategoryManagement
    });
  } catch (error) {
    console.error('Error updating main category management:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A record with this combination already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteMainCategoryManagement = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if main category management exists
    const existingMainCategoryManagement = await prisma.mainCategoryManagement.findUnique({
      where: { id: parseInt(id) },
      include: {
        childCategories: true
      }
    });

    if (!existingMainCategoryManagement) {
      return res.status(404).json({ message: 'Main category management not found' });
    }

    // Check if it has child categories
    if (existingMainCategoryManagement.childCategories.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete main category management that has child categories. Please delete or reassign child categories first.'
      });
    }

    // Delete icon file if it exists
    if (existingMainCategoryManagement.icon) {
      const filePath = path.join(__dirname, '..', existingMainCategoryManagement.icon.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') console.error('Error deleting file:', err);
        });
      }
    }

    // Delete main category management
    await prisma.mainCategoryManagement.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: 'Main category management deleted successfully' });
  } catch (error) {
    console.error('Error deleting main category management:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all main category managements by parent category (for hierarchical navigation)
exports.getMainCategoryManagementsByParent = async (req, res) => {
  try {
    const { parentCategoryId } = req.params;

    const where = parentCategoryId === 'null' || !parentCategoryId
      ? { parentCategoryId: null }
      : { parentCategoryId: parseInt(parentCategoryId) };

    const mainCategoryManagements = await prisma.mainCategoryManagement.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        categoryManagementType: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            childCategories: true
          }
        }
      }
    });

    res.status(200).json({ mainCategoryManagements });
  } catch (error) {
    console.error('Error retrieving main category managements by parent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get categories in tree/hierarchical format (for Tree View)
exports.getCategoriesTree = async (req, res) => {
  try {
    const { 
      status, 
      categoryManagementTypeId, 
      roleVisibility,
      search 
    } = req.query;

    // Build filter object
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (categoryManagementTypeId && categoryManagementTypeId !== 'all') {
      where.categoryManagementTypeId = parseInt(categoryManagementTypeId);
    }
    if (roleVisibility && roleVisibility !== 'all') {
      // If roleVisibility is stored as JSON or comma-separated, we need to search within it
      where.roleVisibility = {
        contains: roleVisibility
      };
    }
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get all categories
    const allCategories = await prisma.mainCategoryManagement.findMany({
      where,
      include: {
        categoryManagementType: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            childCategories: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    // Build tree structure
    const buildTree = (parentId = null) => {
      return allCategories
        .filter(cat => {
          if (parentId === null) return cat.parentCategoryId === null;
          return cat.parentCategoryId === parentId;
        })
        .map(cat => ({
          ...cat,
          itemCount: cat._count.childCategories,
          children: buildTree(cat.id)
        }));
    };

    const tree = buildTree();

    res.status(200).json({
      categories: tree,
      total: allCategories.length
    });
  } catch (error) {
    console.error('Error retrieving categories tree:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get categories in table format (flat list)
exports.getCategoriesTable = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      categoryManagementTypeId,
      roleVisibility,
      sortBy = 'name',
      sortOrder = 'asc',
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (categoryManagementTypeId && categoryManagementTypeId !== 'all') {
      where.categoryManagementTypeId = parseInt(categoryManagementTypeId);
    }
    if (roleVisibility && roleVisibility !== 'all') {
      where.roleVisibility = {
        contains: roleVisibility
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build sort object
    const orderBy = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder === 'desc' ? 'desc' : 'asc';
    } else if (sortBy === 'displayOrder') {
      orderBy.displayOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const [categories, total] = await Promise.all([
      prisma.mainCategoryManagement.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          categoryManagementType: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          parentCategory: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              childCategories: true
            }
          }
        }
      }),
      prisma.mainCategoryManagement.count({ where })
    ]);

    res.status(200).json({
      categories: categories.map(cat => ({
        ...cat,
        itemCount: cat._count.childCategories
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error retrieving categories table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search categories
exports.searchCategories = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const categories = await prisma.mainCategoryManagement.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { slugOrUrl: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: {
        categoryManagementType: {
          select: {
            id: true,
            name: true
          }
        },
        parentCategory: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            childCategories: true
          }
        }
      },
      orderBy: { name: 'asc' },
      take: 50 // Limit search results
    });

    res.status(200).json({
      categories: categories.map(cat => ({
        ...cat,
        itemCount: cat._count.childCategories
      })),
      total: categories.length
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Duplicate a category
exports.duplicateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the original category
    const originalCategory = await prisma.mainCategoryManagement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!originalCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create a duplicate with modified name
    const duplicateName = `${originalCategory.name} (Copy)`;
    
    // Check if duplicate name already exists, if so add number
    let finalName = duplicateName;
    let counter = 1;
    while (await prisma.mainCategoryManagement.findFirst({
      where: { name: finalName }
    })) {
      finalName = `${originalCategory.name} (Copy ${counter})`;
      counter++;
    }

    const duplicatedCategory = await prisma.mainCategoryManagement.create({
      data: {
        name: finalName,
        status: originalCategory.status,
        slugOrUrl: originalCategory.slugOrUrl ? `${originalCategory.slugOrUrl}-copy` : null,
        categoryManagementTypeId: originalCategory.categoryManagementTypeId,
        description: originalCategory.description,
        parentCategoryId: originalCategory.parentCategoryId,
        displayOrder: originalCategory.displayOrder,
        icon: originalCategory.icon, // Same icon path (if you want to copy the file, you'd need additional logic)
        tagColor: originalCategory.tagColor,
        roleVisibility: originalCategory.roleVisibility,
        linkedPage: originalCategory.linkedPage,
        seoTitle: originalCategory.seoTitle,
        seoDescription: originalCategory.seoDescription,
        displayLayout: originalCategory.displayLayout
      },
      include: {
        categoryManagementType: true,
        parentCategory: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Category duplicated successfully',
      category: duplicatedCategory
    });
  } catch (error) {
    console.error('Error duplicating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get filter options (for dropdowns)
exports.getFilterOptions = async (req, res) => {
  try {
    // Get all category management types
    const categoryManagementTypes = await prisma.categoryManagementType.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' }
    });

    // Get all unique statuses
    const statuses = await prisma.mainCategoryManagement.findMany({
      select: { status: true },
      distinct: ['status']
    });

    // Get all unique role visibilities (if stored as JSON, you might need to parse)
    const roleVisibilities = await prisma.mainCategoryManagement.findMany({
      where: {
        roleVisibility: { not: null }
      },
      select: { roleVisibility: true },
      distinct: ['roleVisibility']
    });

    res.status(200).json({
      categoryManagementTypes: categoryManagementTypes.map(type => ({
        id: type.id,
        name: type.name
      })),
      statuses: statuses.map(s => s.status),
      roleVisibilities: roleVisibilities
        .map(r => r.roleVisibility)
        .filter(r => r !== null)
        .slice(0, 20) // Limit to prevent too many options
    });
  } catch (error) {
    console.error('Error retrieving filter options:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

