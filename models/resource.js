const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all Resources
const getAllResources = async () => {
  return await prisma.resource.findMany({
    include: {
      resourceCategory: true
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get Resource by ID
const getResourceById = async (id) => {
  return await prisma.resource.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      resourceCategory: true
    },
  });
};

// Get Resources by ResourceCategoryId
const getResourcesByCategoryId = async (categoryId) => {
  return await prisma.resource.findMany({
    where: {
      ResourceCategoryId: parseInt(categoryId),
    },
    include: {
      resourceCategory: true
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Create new Resource
const createResource = async (data) => {
  return await prisma.resource.create({
    data: {
      title: data.title,
      description: data.description,
      file: data.file,
      ResourceCategoryId: parseInt(data.ResourceCategoryId),
      version: data.version,
      Visibility: data.Visibility !== undefined ? data.Visibility : true,
      expiredDate: data.expiredDate ? new Date(data.expiredDate) : null,
      feature: data.feature !== undefined ? data.feature : false,
      status: data.status !== undefined ? data.status : true,
    },
    include: {
      resourceCategory: true
    },
  });
};

// Update Resource
const updateResource = async (id, data) => {
  const updateData = {
    title: data.title,
    description: data.description,
    file: data.file,
    ResourceCategoryId: data.ResourceCategoryId ? parseInt(data.ResourceCategoryId) : undefined,
    version: data.version,
    Visibility: data.Visibility,
    expiredDate: data.expiredDate ? new Date(data.expiredDate) : data.expiredDate === null ? null : undefined,
    feature: data.feature,
    status: data.status,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  return await prisma.resource.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
    include: {
      resourceCategory: true
    },
  });
};

// Delete Resource
const deleteResource = async (id) => {
  return await prisma.resource.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllResources,
  getResourceById,
  getResourcesByCategoryId,
  createResource,
  updateResource,
  deleteResource,
};

