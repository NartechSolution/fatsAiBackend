const prisma = require('../prisma/client');

// Get all SettingRolePermissions
const getAllSettingRolePermissions = async () => {
  return await prisma.settingRolePermission.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get SettingRolePermission by ID
const getSettingRolePermissionById = async (id) => {
  return await prisma.settingRolePermission.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create new SettingRolePermission
const createSettingRolePermission = async (data) => {
  return await prisma.settingRolePermission.create({
    data: {
      roleForNewUsers: data.roleForNewUsers,
      allowRoleEditor: data.allowRoleEditor !== undefined ? data.allowRoleEditor : false,
      allowDeparmentCreation: data.allowDeparmentCreation !== undefined ? data.allowDeparmentCreation : false,
    },
  });
};

// Update SettingRolePermission
const updateSettingRolePermission = async (id, data) => {
  const updateData = {
    roleForNewUsers: data.roleForNewUsers,
    allowRoleEditor: data.allowRoleEditor,
    allowDeparmentCreation: data.allowDeparmentCreation,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  return await prisma.settingRolePermission.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
  });
};

// Delete SettingRolePermission
const deleteSettingRolePermission = async (id) => {
  return await prisma.settingRolePermission.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllSettingRolePermissions,
  getSettingRolePermissionById,
  createSettingRolePermission,
  updateSettingRolePermission,
  deleteSettingRolePermission,
};

