const prisma = require('../prisma/client');

// Get all BrandingAppearances
const getAllBrandingAppearances = async () => {
  return await prisma.brandingAppearance.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get BrandingAppearance by ID
const getBrandingAppearanceById = async (id) => {
  return await prisma.brandingAppearance.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create new BrandingAppearance
const createBrandingAppearance = async (data) => {
  return await prisma.brandingAppearance.create({
    data: {
      logo: data.logo,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      fontFamily: data.fontFamily,
      buttonCorner: data.buttonCorner,
      darkThemes: data.darkThemes !== undefined ? data.darkThemes : false,
    },
  });
};

// Update BrandingAppearance
const updateBrandingAppearance = async (id, data) => {
  const updateData = {
    logo: data.logo,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    accentColor: data.accentColor,
    fontFamily: data.fontFamily,
    buttonCorner: data.buttonCorner,
    darkThemes: data.darkThemes,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  return await prisma.brandingAppearance.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
  });
};

// Delete BrandingAppearance
const deleteBrandingAppearance = async (id) => {
  return await prisma.brandingAppearance.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllBrandingAppearances,
  getBrandingAppearanceById,
  createBrandingAppearance,
  updateBrandingAppearance,
  deleteBrandingAppearance,
};

