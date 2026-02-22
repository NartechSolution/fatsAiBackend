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
 * Helper function to get total assets with growth metrics
 */
const getTotalAssetsData = async () => {
  // Get total assets count
  const totalAssets = await prisma.asset.count();
  
  // Get current date and previous month date for comparison
  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  
  // Get total assets count from previous month
  const previousMonthTotalAssets = await prisma.asset.count({
    where: {
      createdAt: {
        lt: previousMonthDate
      }
    }
  });
  
  // Calculate growth percentage
  const growthPercentage = previousMonthTotalAssets > 0 
    ? Math.round(((totalAssets - previousMonthTotalAssets) / previousMonthTotalAssets) * 100) 
    : 12; // Default to 12% if no previous data
  
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
 * Helper function to get active assets with growth metrics
 */
const getActiveAssetsData = async () => {
  // Get active assets count (where assetStatus is "In Use")
  const activeAssets = await prisma.asset.count({
    where: { assetStatus: "In Use" }
  });
  
  // Get current date and previous month date for comparison
  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  
  // Get active assets count from previous month
  const previousMonthActiveAssets = await prisma.asset.count({
    where: {
      assetStatus: "In Use",
      createdAt: {
        lt: previousMonthDate
      }
    }
  });
  
  // Calculate growth percentage
  const growthPercentage = previousMonthActiveAssets > 0 
    ? Math.round(((activeAssets - previousMonthActiveAssets) / previousMonthActiveAssets) * 100) 
    : 8; // Default to 8% if no previous data
  
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
 * Helper function to get warning assets with new warnings this week
 */
const getWarningAssetsData = async () => {
  // Get warning assets count (where assetCondition is "Poor" or "Fair")
  const warningAssets = await prisma.asset.count({
    where: {
      assetCondition: {
        in: ["Poor", "Fair"]
      }
    }
  });
  
  // Get assets created in the last 7 days with poor/fair condition
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const newWarningAssetsThisWeek = await prisma.asset.count({
    where: {
      assetCondition: {
        in: ["Poor", "Fair"]
      },
      createdAt: {
        gte: oneWeekAgo
      }
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
 * Helper function to get maintenance assets with scheduled maintenance today
 */
const getMaintenanceAssetsData = async () => {
  // Get under maintenance assets count
  const maintenanceAssets = await prisma.asset.count({
    where: { assetStatus: "Under Maintenance" }
  });
  
  // Since we don't have a maintenance schedule table, we'll use a placeholder value
  const scheduledToday = 3; // Placeholder value
  
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
 * Helper function to get IoT devices count
 */
const getIotDevicesData = async () => {
  // Get total IoT devices count
  const iotDevices = await prisma.iotDevice.count();
  
  return {
    count: iotDevices
  };
};

/**
 * Helper function to get new assets count (NewAsset with no tag assigned - tagNumber null)
 * New asset = has no linked AssetTag
 */
const getNewAssetsData = async () => {
  const newAssetsCount = await prisma.newAsset.count({
    where: {
      assetTags: {
        none: {}
      }
    }
  });

  return {
    count: newAssetsCount
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
    // Get data for all dashboard cards using helper functions (including new assets - no tag assigned)
    const [totalAssetsData, activeAssetsData, warningAssetsData, maintenanceAssetsData, iotDevicesData, newAssetsData] = await Promise.all([
      getTotalAssetsData(),
      getActiveAssetsData(),
      getWarningAssetsData(),
      getMaintenanceAssetsData(),
      getIotDevicesData(),
      getNewAssetsData()
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
