const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all ResourceCategories
const getAllResourceCategories = async () => {
  return await prisma.resourceCategory.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get ResourceCategory by ID
const getResourceCategoryById = async (id) => {
  return await prisma.resourceCategory.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create new ResourceCategory
const createResourceCategory = async (data) => {
  return await prisma.resourceCategory.create({
    data: {
      name: data.name,
      name_ar: data.name_ar,
      name_filo: data.name_filo,
      status: data.status !== undefined ? data.status : true,
    },
  });
};

// Update ResourceCategory
const updateResourceCategory = async (id, data) => {
  const updateData = {
    name: data.name,
    name_ar: data.name_ar,
    name_filo: data.name_filo,
    status: data.status !== undefined ? data.status : true,
  };
  
  return await prisma.resourceCategory.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
  });
};

// Delete ResourceCategory
const deleteResourceCategory = async (id) => {
  return await prisma.resourceCategory.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllResourceCategories,
  getResourceCategoryById,
  createResourceCategory,
  updateResourceCategory,
  deleteResourceCategory,
};

