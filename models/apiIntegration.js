const prisma = require('../prisma/client');

// Get all ApiIntegrations
const getAllApiIntegrations = async () => {
  return await prisma.apiIntegration.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get ApiIntegration by ID
const getApiIntegrationById = async (id) => {
  return await prisma.apiIntegration.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create new ApiIntegration
const createApiIntegration = async (data) => {
  return await prisma.apiIntegration.create({
    data: {
      apiKey: data.apiKey,
      googleMapIntegration: data.googleMapIntegration !== undefined ? data.googleMapIntegration : false,
      cloudStorage: data.cloudStorage !== undefined ? data.cloudStorage : false,
      emailService: data.emailService !== undefined ? data.emailService : false,
    },
  });
};

// Update ApiIntegration
const updateApiIntegration = async (id, data) => {
  const updateData = {
    apiKey: data.apiKey,
    googleMapIntegration: data.googleMapIntegration,
    cloudStorage: data.cloudStorage,
    emailService: data.emailService,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  return await prisma.apiIntegration.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
  });
};

// Delete ApiIntegration
const deleteApiIntegration = async (id) => {
  return await prisma.apiIntegration.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllApiIntegrations,
  getApiIntegrationById,
  createApiIntegration,
  updateApiIntegration,
  deleteApiIntegration,
};

