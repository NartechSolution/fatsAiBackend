const prisma = require('../prisma/client');

/**
 * Helper function to get IoT sensor data for dashboard
 * - Temperature
 * - Humidity
 * - Gas Leak
 * - Soil Moisture
 * - Rain Status
 */
const getIoTSensorData = async () => {
  try {
    // Get the latest temperature and humidity reading
    const latestTemperature = await prisma.temperature.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Get the latest soil moisture reading
    const latestSoilMoisture = await prisma.soilMoistureData.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Get the latest gas detection reading
    const latestGasDetection = await prisma.gasDetection.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get latest vibration detection reading
    const latestVibration = await prisma.vibrationDetection.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get latest ultrasonic reading from carDetection (distance)
    const latestUltrasonic = await prisma.carDetection.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get latest motion detection reading
    const latestMotion = await prisma.motionDetection.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get the latest rain status reading
    const latestRainStatus = await prisma.rainStatus.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get historical temperature data for the graph (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const temperatureHistory = await prisma.temperature.findMany({
      where: {
        timestamp: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        temperature: true,
        timestamp: true
      }
    });

    // Get historical humidity data for the graph (last 24 hours)
    const humidityHistory = await prisma.temperature.findMany({
      where: {
        timestamp: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        humidity: true,
        timestamp: true
      }
    });

    // Get historical soil moisture data for the graph (last 24 hours)
    const soilMoistureHistory = await prisma.soilMoistureData.findMany({
      where: {
        timestamp: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        moisture: true,
        timestamp: true
      }
    });

    // Get historical vibration data for the graph (last 24 hours)
    const vibrationHistory = await prisma.vibrationDetection.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        status: true,
        createdAt: true
      }
    });

    // Get historical ultrasonic data for the graph (last 24 hours) from carDetection
    const ultrasonicHistory = await prisma.carDetection.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        distance: true,
        createdAt: true
      }
    });

    // Get historical motion data for the graph (last 24 hours)
    const motionHistory = await prisma.motionDetection.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        status: true,
        createdAt: true
      }
    });

    // Prepare the response data
    return {
      temperature: {
        current: latestTemperature ? latestTemperature.temperature.toFixed(1) : "N/A",
        unit: "°C",
        history: temperatureHistory.map(item => ({
          value: item.temperature,
          timestamp: item.timestamp
        }))
      },
      humidity: {
        current: latestTemperature ? Math.round(latestTemperature.humidity) : "N/A",
        unit: "%",
        history: humidityHistory.map(item => ({
          value: item.humidity,
          timestamp: item.timestamp
        }))
      },
      gasLeak: {
        status: latestGasDetection ? (latestGasDetection.status < 400 ? "Normal" : "Alert") : "N/A"
      },
      vibration: {
        current: latestVibration ? (isNaN(Number(latestVibration.status)) ? latestVibration.status : Number(latestVibration.status)) : "N/A",
        unit: latestVibration && !isNaN(Number(latestVibration.status)) ? "m/s²" : undefined,
        history: vibrationHistory.map(item => ({
          value: isNaN(Number(item.status)) ? item.status : Number(item.status),
          timestamp: item.createdAt
        }))
      },
      ultrasonic: {
        current: typeof latestUltrasonic?.distance === 'number' ? Number(latestUltrasonic.distance.toFixed(2)) : (latestUltrasonic ? latestUltrasonic.distance : "N/A"),
        unit: typeof latestUltrasonic?.distance === 'number' ? "m" : undefined,
        history: ultrasonicHistory.map(item => ({
          value: item.distance,
          timestamp: item.createdAt
        }))
      },
      motion: {
        status: latestMotion ? latestMotion.status : "N/A",
        history: motionHistory.map(item => ({
          value: item.status,
          timestamp: item.createdAt
        }))
      },
      soilMoisture: {
        current: latestSoilMoisture ? Math.round(latestSoilMoisture.moisture) : "N/A",
        unit: "%",
        history: soilMoistureHistory.map(item => ({
          value: item.moisture,
          timestamp: item.timestamp
        }))
      },
      rain: {
        status: latestRainStatus ? (latestRainStatus.status > 0 ? "Raining" : "No Rain") : "N/A"
      }
    };
  } catch (error) {
    console.error('Error fetching IoT sensor data:', error);
    throw error;
  }
};

/**
 * Base filter: only NewAsset rows that count as "real" assets (have name set).
 * Use this for total so count matches your actual asset list (e.g. 7 not 19).
 */
const newAssetTotalWhere = {
  AND: [
    { name: { not: null } },
    { name: { not: "" } }
  ]
};

/**
 * Helper function to get total assets with growth metrics (from NewAsset model)
 * Optionally scoped to a specific userId (for member-specific dashboards).
 */
const getTotalAssetsData = async (userId) => {
  const totalAssets = await prisma.newAsset.count({
    where: {
      ...newAssetTotalWhere,
      ...(userId ? { userId } : {})
    }
  });

  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

  const previousMonthTotalAssets = await prisma.newAsset.count({
    where: {
      ...newAssetTotalWhere,
      ...(userId ? { userId } : {}),
      createdAt: {
        lt: previousMonthDate
      }
    }
  });

  let growthPercentage = previousMonthTotalAssets > 0
    ? Math.round(((totalAssets - previousMonthTotalAssets) / previousMonthTotalAssets) * 100)
    : 12;
  growthPercentage = Math.min(999, Math.max(-99, growthPercentage));

  return {
    count: totalAssets,
    growth: {
      percentage: growthPercentage,
      period: "month"
    },
    status: "System Healthy"
  };
};

/**
 * Helper function to get active assets (from NewAsset model).
 * Active = status is "active" (same as api/new-assets).
 */
const getActiveAssetsData = async (userId) => {
  const activeWhere = {
    ...newAssetTotalWhere,
    status: "active",
    ...(userId ? { userId } : {})
  };

  const activeAssets = await prisma.newAsset.count({
    where: activeWhere
  });

  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

  const previousMonthActiveAssets = await prisma.newAsset.count({
    where: {
      ...activeWhere,
      createdAt: { lt: previousMonthDate }
    }
  });

  let growthPercentage = previousMonthActiveAssets > 0
    ? Math.round(((activeAssets - previousMonthActiveAssets) / previousMonthActiveAssets) * 100)
    : 8;
  growthPercentage = Math.min(999, Math.max(-99, growthPercentage));

  return {
    count: activeAssets,
    growth: {
      percentage: growthPercentage,
      period: "month"
    },
    status: "Optimal"
  };
};

/**
 * Helper function to get warning assets with new warnings this week (from NewAsset model)
 * Optionally scoped to a specific userId.
 */
const getWarningAssetsData = async (userId) => {
  const conditions = await prisma.assetCondition.findMany({
    where: { status: true },
    select: { id: true, name: true }
  });
  const nameToId = (name) => conditions.find((c) => c.name.toLowerCase().includes(name.toLowerCase()))?.id;
  const fairId = nameToId("Fair");
  const poorId = nameToId("Poor");
  const damagedId = nameToId("Damaged");
  const warningConditionIds = [fairId, poorId, damagedId].filter(Boolean);

  const whereWarning = warningConditionIds.length
    ? {
        ...newAssetTotalWhere,
        assetConditionId: { in: warningConditionIds },
        ...(userId ? { userId } : {})
      }
    : {
        ...newAssetTotalWhere,
        assetConditionId: { in: [] },
        ...(userId ? { userId } : {})
      };

  const warningAssets = await prisma.newAsset.count({
    where: whereWarning
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const newWarningAssetsThisWeek = await prisma.newAsset.count({
    where: {
      ...whereWarning,
      createdAt: { gte: oneWeekAgo }
    }
  });

  return {
    count: warningAssets,
    new: {
      count: newWarningAssetsThisWeek,
      period: "week"
    },
    status: "Attention Needed"
  };
};

/**
 * Helper function to get maintenance assets (from NewAsset model).
 * Under maintenance = status is "maintenance" (same as api/new-assets).
 */
const getMaintenanceAssetsData = async (userId) => {
  const maintenanceAssets = await prisma.newAsset.count({
    where: {
      ...newAssetTotalWhere,
      status: "maintenance",
      ...(userId ? { userId } : {})
    }
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const scheduledToday = await prisma.logMaintenance.count({
    where: {
      startDate: { gte: todayStart, lt: todayEnd },
      ...(userId
        ? {
            maintenance: {
              userId
            }
          }
        : {})
    }
  });

  return {
    count: maintenanceAssets,
    scheduled: {
      count: scheduledToday,
      period: "today"
    },
    status: "In Progress"
  };
};

/**
 * Helper function to get IoT devices count.
 * If userId is provided, counts only IoT devices that are linked (via IotDeviceAsset -> Maintenance)
 * to maintenance records created by that user. Otherwise, returns the global count.
 */
const getIotDevicesData = async (userId) => {
  let where = {};

  if (userId) {
    where = {
      iotDeviceAssets: {
        some: {
          maintenances: {
            some: {
              userId
            }
          }
        }
      }
    };
  }

  const iotDevices = await prisma.iotDevice.count({
    where
  });
  
  return {
    count: iotDevices
  };
};

/**
 * Helper function to get new assets count (from NewAsset model).
 * "New asset" = tagNumber is null = no tag assigned (untagged).
 */
const getNewAssetsData = async (userId) => {
  const newAssetsCount = await prisma.newAsset.count({
    where: {
      ...newAssetTotalWhere,
      assetTags: { none: {} },
      ...(userId ? { userId } : {})
    }
  });

  return {
    count: newAssetsCount
  };
};

/**
 * Helper function to get department statistics
 * - Total departments
 * - Active departments
 * - Inactive departments
 * If userId is provided, only departments that have NewAssets for that user are counted.
 */
const getDepartmentStats = async (userId) => {
  // Global stats (no user scoping)
  if (!userId) {
    const [totalDepartments, activeDepartments, inactiveDepartments] = await Promise.all([
      prisma.department.count(),
      prisma.department.count({
        where: {
          status: { in: ['active', 'Active'] }
        }
      }),
      prisma.department.count({
        where: {
          status: { in: ['inactive', 'Inactive'] }
        }
      })
    ]);

    return {
      total: totalDepartments,
      active: activeDepartments,
      inactive: inactiveDepartments
    };
  }

  // Scoped stats: only departments that have at least one NewAsset for this user
  const baseWhere = {
    newAssets: {
      some: {
        ...newAssetTotalWhere,
        userId
      }
    }
  };

  const [totalDepartments, activeDepartments, inactiveDepartments] = await Promise.all([
    prisma.department.count({ where: baseWhere }),
    prisma.department.count({
      where: {
        ...baseWhere,
        status: { in: ['active', 'Active'] }
      }
    }),
    prisma.department.count({
      where: {
        ...baseWhere,
        status: { in: ['inactive', 'Inactive'] }
      }
    })
  ]);

  return {
    total: totalDepartments,
    active: activeDepartments,
    inactive: inactiveDepartments
  };
};

/**
 * Helper function to get asset category statistics
 * - Total asset categories
 * - Total subcategories
 * - Total asset items (from NewAsset model)
 * If userId is provided, asset categories and items are scoped to that user's assets.
 */
const getAssetCategoryStats = async (userId) => {
  // Global stats (no user scoping)
  if (!userId) {
    const [categoryCount, subCategoryCount, assetItemCount] = await Promise.all([
      prisma.assetCategory.count(),
      prisma.subCategory.count(),
      prisma.newAsset.count({
        where: newAssetTotalWhere
      })
    ]);

    return {
      categories: categoryCount,
      subCategories: subCategoryCount,
      items: assetItemCount
    };
  }

  const [categoryCount, subCategoryCount, assetItemCount] = await Promise.all([
    // Categories that have at least one NewAsset for this user
    prisma.assetCategory.count({
      where: {
        newAssets: {
          some: {
            ...newAssetTotalWhere,
            userId
          }
        }
      }
    }),
    // Subcategories are system-wide definitions; keep global
    prisma.subCategory.count(),
    // Total NewAsset items for this user
    prisma.newAsset.count({
      where: {
        ...newAssetTotalWhere,
        userId
      }
    })
  ]);

  return {
    categories: categoryCount,
    subCategories: subCategoryCount,
    items: assetItemCount
  };
};

/**
 * Helper function to get employee statistics
 * - Total employees
 * - Active employees
 * - Employees on leave
 * If userId is provided, only employees linked to that user's assets are counted.
 */
const getEmployeeStats = async (userId) => {
  // Global stats (no user scoping)
  if (!userId) {
    const [totalEmployees, activeEmployees, onLeaveEmployees] = await Promise.all([
      prisma.employeeList.count(),
      prisma.employeeList.count({
        where: {
          status: { in: ['active', 'Active'] }
        }
      }),
      prisma.employeeList.count({
        where: {
          status: { in: ['on_leave', 'On Leave', 'on leave'] }
        }
      })
    ]);

    return {
      total: totalEmployees,
      active: activeEmployees,
      onLeave: onLeaveEmployees
    };
  }

  // Scoped stats: only employees that are linked to NewAssets for this user
  const baseWhere = {
    newAssets: {
      some: {
        ...newAssetTotalWhere,
        userId
      }
    }
  };

  const [totalEmployees, activeEmployees, onLeaveEmployees] = await Promise.all([
    prisma.employeeList.count({ where: baseWhere }),
    prisma.employeeList.count({
      where: {
        ...baseWhere,
        status: { in: ['active', 'Active'] }
      }
    }),
    prisma.employeeList.count({
      where: {
        ...baseWhere,
        status: { in: ['on_leave', 'On Leave', 'on leave'] }
      }
    })
  ]);

  return {
    total: totalEmployees,
    active: activeEmployees,
    onLeave: onLeaveEmployees
  };
};

/**
 * Helper function to get roles and permissions statistics
 * - Total roles
 * - Total permissions
 * - Total custom role-permission assignments
 * (These are system-wide configuration values, so they are not scoped per user.)
 */
const getRolePermissionStats = async () => {
  const [roleCount, permissionCount, customAssignments] = await Promise.all([
    prisma.role.count(),
    prisma.permission.count(),
    prisma.rolePermission.count()
  ]);

  return {
    roles: roleCount,
    permissions: permissionCount,
    custom: customAssignments
  };
};

/**
 * Helper function to get cities and locations statistics
 * - Total cities
 * - Total locations
 * - Total warehouses (using ManageLocation as warehouse-like entities)
 * If userId is provided, only entities associated with that user are counted.
 */
const getCityLocationStats = async (userId) => {
  // Global stats (no user scoping)
  if (!userId) {
    const [cityCount, locationCount, warehouseCount] = await Promise.all([
      prisma.city.count(),
      prisma.location.count(),
      prisma.manageLocation.count()
    ]);

    return {
      cities: cityCount,
      locations: locationCount,
      warehouses: warehouseCount
    };
  }

  const [cityCount, locationCount, warehouseCount] = await Promise.all([
    // Cities that have NewAssets for this user
    prisma.city.count({
      where: {
        newAssets: {
          some: {
            ...newAssetTotalWhere,
            userId
          }
        }
      }
    }),
    // Locations that have ManageLocations created by this user
    prisma.location.count({
      where: {
        manageLocations: {
          some: {
            userId
          }
        }
      }
    }),
    // Warehouses (ManageLocations) owned by this user
    prisma.manageLocation.count({
      where: {
        userId
      }
    })
  ]);

  return {
    cities: cityCount,
    locations: locationCount,
    warehouses: warehouseCount
  };
};

/**
 * Helper function to get brands and vendors statistics
 * - Total vendors (using AssetBrand as vendor-like entities)
 * - Total brands
 * - Total contracts (placeholder, adjust when contract model is available)
 * If userId is provided, vendors are scoped to brands used by that user's assets;
 * brands remain global configuration.
 */
const getBrandVendorStats = async (userId) => {
  // Global stats (no user scoping)
  if (!userId) {
    const [vendorCount, brandCount] = await Promise.all([
      prisma.assetBrand.count(),
      prisma.brand.count()
    ]);

    return {
      vendors: vendorCount,
      brands: brandCount,
      contracts: 0
    };
  }

  const [vendorCount, brandCount] = await Promise.all([
    // Asset brands that have NewAssets for this user
    prisma.assetBrand.count({
      where: {
        newAssets: {
          some: {
            ...newAssetTotalWhere,
            userId
          }
        }
      }
    }),
    // Brands remain system-wide
    prisma.brand.count()
  ]);

  return {
    vendors: vendorCount,
    brands: brandCount,
    contracts: 0
  };
};

/**
 * Get dashboard statistics for the main dashboard
 * - Total Assets with growth metrics
 * - Active Assets with growth metrics
 * - Warning Assets with new warnings this week
 * - Under Maintenance Assets with scheduled maintenance today
 * - IoT Devices count
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Derive the current user's ID from the verified JWT (supports both userId and id keys)
    const userId = req.user && (req.user.userId || req.user.id);

    // Get data for all dashboard cards using helper functions (including new assets - no tag assigned)
    const [totalAssetsData, activeAssetsData, warningAssetsData, maintenanceAssetsData, iotDevicesData, newAssetsData] = await Promise.all([
      getTotalAssetsData(userId),
      getActiveAssetsData(userId),
      getWarningAssetsData(userId),
      getMaintenanceAssetsData(userId),
      getIotDevicesData(userId),
      getNewAssetsData(userId)
    ]);
    
    res.status(200).json({
      totalAssets: totalAssetsData,
      activeAssets: activeAssetsData,
      warningAssets: warningAssetsData,
      maintenanceAssets: maintenanceAssetsData,
      iotDevices: iotDevicesData,
      newAssets: newAssetsData
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get statistics for the admin dashboard cards
 * - Departments
 * - Asset Categories
 * - Employees
 * - Roles & Permissions
 * - Cities & Locations
 * - Brands & Vendors
 */
exports.getAdminDashboardStats = async (req, res) => {
  try {
    // Derive the current user's ID from the verified JWT (supports both userId and id keys)
    const userId = req.user && (req.user.userId || req.user.id);

    const [
      departmentStats,
      assetCategoryStats,
      employeeStats,
      rolePermissionStats,
      cityLocationStats,
      brandVendorStats
    ] = await Promise.all([
      getDepartmentStats(userId),
      getAssetCategoryStats(userId),
      getEmployeeStats(userId),
      getRolePermissionStats(),
      getCityLocationStats(userId),
      getBrandVendorStats(userId)
    ]);

    res.status(200).json({
      departments: departmentStats,
      assetCategories: assetCategoryStats,
      employees: employeeStats,
      rolesPermissions: rolePermissionStats,
      citiesLocations: cityLocationStats,
      brandsVendors: brandVendorStats
    });
  } catch (error) {
    console.error('Error fetching admin dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard statistics' });
  }
};

/**
 * Get IoT sensor data for the dashboard
 */
exports.getIoTSensorData = async (req, res) => {
  try {
    const sensorData = await getIoTSensorData();
    res.status(200).json(sensorData);
  } catch (error) {
    console.error('Error fetching IoT sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch IoT sensor data' });
  }
};
