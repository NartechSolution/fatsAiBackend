const prisma = require('../prisma/client');

// Get all GeneralSettings
const getAllGeneralSettings = async () => {
  return await prisma.generalSetting.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get GeneralSetting by ID
const getGeneralSettingById = async (id) => {
  return await prisma.generalSetting.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create new GeneralSetting
const createGeneralSetting = async (data) => {
  return await prisma.generalSetting.create({
    data: {
      systemName: data.systemName,
      organizationName: data.organizationName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      landingPage: data.landingPage,
      systemDescription: data.systemDescription,
      showBrandName: data.showBrandName !== undefined ? data.showBrandName : true,
      themes: data.themes,
      timeZone: data.timeZone,
      dateFormat: data.dateFormat,
      currencyFormat: data.currencyFormat,
      status: data.status || 'active',
    },
  });
};

// Update GeneralSetting
const updateGeneralSetting = async (id, data) => {
  const updateData = {
    systemName: data.systemName,
    organizationName: data.organizationName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    landingPage: data.landingPage,
    systemDescription: data.systemDescription,
    showBrandName: data.showBrandName,
    themes: data.themes,
    timeZone: data.timeZone,
    dateFormat: data.dateFormat,
    currencyFormat: data.currencyFormat,
    status: data.status,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  return await prisma.generalSetting.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
  });
};

// Delete GeneralSetting
const deleteGeneralSetting = async (id) => {
  return await prisma.generalSetting.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllGeneralSettings,
  getGeneralSettingById,
  createGeneralSetting,
  updateGeneralSetting,
  deleteGeneralSetting,
};

