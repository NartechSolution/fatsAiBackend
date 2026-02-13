const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import Prisma client
const prisma = require('./prisma/client');


// Import routes
const temperatureRoutes = require('./routes/temperatureHumidityRoutes');
const soilMoistureRoutes = require('./routes/soilMoistureRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminDemoRequestRoutes = require('./routes/adminDemoRequestRoutes');
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const fuelLevelRoutes = require('./routes/fuelLevelRoutes');
const assetRoutes = require('./routes/assetRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const locationRoutes = require('./routes/locationRoutes');
const locationTagRoutes = require('./routes/locationTagRoutes');
const vibrationSensorRoutes = require('./routes/vibrationSensorRoutes');
const megaMenuRoutes = require('./routes/megaMenuRoutes');
const subMegaMenuRoutes = require('./routes/subMegaMenuRoutes');
const brandRoutes = require('./routes/brandRoutes');
const assetConditionRoutes = require('./routes/assetConditionRoutes');
const employeeListRoutes = require('./routes/employeeListRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const headOfDepartmentRoutes = require('./routes/headOfDepartmentRoutes');
const npkSensorRoutes = require('./routes/npkSensorRoutes');
const deviceCategoryRoutes = require('./routes/deviceCategoryRoutes');
const iotDeviceRoutes = require('./routes/iotDeviceRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const subscriptionPlanRoutes = require('./routes/subscriptionPlanRoutes');
const pageRoutes = require('./routes/pageRoutes');
const firstContainerRoutes = require('./routes/firstContainerRoutes');
const secondContainerRoutes = require('./routes/secondContainerRoutes');
const thirdContainerRoutes = require('./routes/thirdContainerRoutes');
const fourthContainerRoutes = require('./routes/fourthContainerRoutes');
const commentRoutes = require('./routes/commentRoutes');
const headerRoutes = require('./routes/headerRoutes');
const demoRequestRoutes = require('./routes/demoRequestRoutes');
const languagesRoutes = require('./routes/languagesRoutes');
const gasDetectionRoutes = require('./routes/gasDetectionRoutes');
const carDetectionRoutes = require('./routes/carDetectionRoutes');
const rainStatusRoutes = require('./routes/rainStatusRoutes');
const faqRoutes = require('./routes/faqRoutes');
const motionDetectionRoutes = require('./routes/motionDetectionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const assetTypeRoutes = require('./routes/assetTypeRoutes');
const iotDeviceAssetRoutes = require('./routes/iotDeviceAssetRoutes');
const transferAssetRoutes = require('./routes/transferAssetRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const manageLocationRoutes = require('./routes/manageLocationRoutes');
const headingRoutes = require('./routes/headingRoutes');
const resourceCategoryRoutes = require('./routes/resourceCategoryRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const roleRoutes = require('./routes/roleRoutes');
const accessLevelRoutes = require('./routes/accessLevelRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const permissionCategoryRoutes = require('./routes/permissionCategoryRoutes');
const cityRoutes = require('./routes/cityRoutes');
const prismaRoutes = require('./routes/prismaRoutes');
const assetBrandRoutes = require('./routes/assetBrandRoutes');
const assetCategoryRoutes = require('./routes/assetCategoryRoutes');
const newAssetRoutes = require('./routes/newAssetRoutes');
const newAssetConditionRoutes = require('./routes/newAssetConditionRoutes');
const logMaintenanceRoutes = require('./routes/logMaintenanceRoutes');
const assetHistoryRoutes = require('./routes/assetHistoryRoutes');
const customEventRoutes = require('./routes/customEventRoutes');
const categoryManagementTypeRoutes = require('./routes/categoryManagementTypeRoutes');
const mainCategoryManagementRoutes = require('./routes/mainCategoryManagementRoutes');
const mainFooterRoutes = require('./routes/mainFooterRoutes');
const subFooterRoutes = require('./routes/subFooterRoutes');
const footerItemRoutes = require('./routes/footerItemRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const sliderContentRoutes = require('./routes/sliderContentRoutes');
const generalSettingRoutes = require('./routes/generalSettingRoutes');
const brandingAppearanceRoutes = require('./routes/brandingAppearanceRoutes');
const authenticationSecurityRoutes = require('./routes/authenticationSecurityRoutes');
const settingRolePermissionRoutes = require('./routes/settingRolePermissionRoutes');
const notificationAlertRoutes = require('./routes/notificationAlertRoutes');
const apiIntegrationRoutes = require('./routes/apiIntegrationRoutes');
const dataManagementRoutes = require('./routes/dataManagementRoutes');
const languageLocalizationRoutes = require('./routes/languageLocalizationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const systemHealthRoutes = require('./routes/systemHealthRoutes');
const assetTagRoutes = require('./routes/assetTagRoutes');


// Import backup service
const { scheduleWeeklyBackup } = require('./services/backupService');

// Initialize Express app
const app = express();

// Set port
const PORT = process.env.PORT || 14102;

// Enable gzip compression for all responses
app.use(compression({
  // Compress responses with these MIME types
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  // Compression level (1-9, 6 is default)
  level: 6,
  // Only compress responses larger than this threshold (in bytes)
  threshold: 1024
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add a simple request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  next();
});

// Global Audit Log Middleware
const auditLogMiddleware = require('./middleware/auditLogMiddleware');
app.use(auditLogMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve documents from uploads/documents directory
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));



// Initialize server and connect to database
async function startServer() {
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('Connected to SQL Server database');

    // Initialize scheduled weekly backup (cron job)
    scheduleWeeklyBackup();

    // API Routes
    app.use('/api/temperature', temperatureRoutes);
    app.use('/api/soil-moisture', soilMoistureRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin', adminDemoRequestRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/admin-auth', adminAuthRoutes);
    app.use('/api/fuel-level', fuelLevelRoutes);
    app.use('/api/assets', assetRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/subcategories', subCategoryRoutes);
    app.use('/api/locations', locationRoutes);
    app.use('/api/location-tags', locationTagRoutes);
    app.use('/api/vibration', vibrationSensorRoutes);
    app.use('/api/megamenu', megaMenuRoutes);
    app.use('/api/submegamenu', subMegaMenuRoutes);
    app.use('/api/brands', brandRoutes);
    app.use('/api/asset-conditions', assetConditionRoutes);
    app.use('/api/employees', employeeListRoutes);
    app.use('/api/departments', departmentRoutes);
    app.use('/api/heads-of-department', headOfDepartmentRoutes);
    app.use('/api/npk', npkSensorRoutes);
    app.use('/api/device-categories', deviceCategoryRoutes);
    app.use('/api/iot-devices', iotDeviceRoutes);
    app.use('/api/services', serviceRoutes);
    app.use('/api/subscription-plans', subscriptionPlanRoutes);
    app.use('/api/pages', pageRoutes);
    app.use('/api/first-containers', firstContainerRoutes);
    app.use('/api/second-containers', secondContainerRoutes);
    app.use('/api/third-containers', thirdContainerRoutes);
    app.use('/api/fourth-containers', fourthContainerRoutes);
    app.use('/api/comments', commentRoutes);
    app.use('/api/headers', headerRoutes);
    app.use('/api/demo-requests', demoRequestRoutes);
    app.use('/api/languages', languagesRoutes);
    app.use('/api/gas-detection', gasDetectionRoutes);
    app.use('/api/car-detection', carDetectionRoutes);
    app.use('/api/rain-status', rainStatusRoutes);
    app.use('/api/faqs', faqRoutes);
    app.use('/api/motion-detection', motionDetectionRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/asset-types', assetTypeRoutes);
    app.use('/api/iot-device-assets', iotDeviceAssetRoutes);
    app.use('/api/transfer-assets', transferAssetRoutes);
    app.use('/api/technicians', technicianRoutes);
    app.use('/api/maintenances', maintenanceRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/manage-locations', manageLocationRoutes);
    app.use('/api/headings', headingRoutes);
    app.use('/api/resource-categories', resourceCategoryRoutes);
    app.use('/api/resources', resourceRoutes);
    app.use('/api/roles', roleRoutes);
    app.use('/api/access-levels', accessLevelRoutes);
    app.use('/api/permissions', permissionRoutes);
    app.use('/api/permission-categories', permissionCategoryRoutes);
    app.use('/api/cities', cityRoutes);
    app.use('/api/prisma', prismaRoutes);
    app.use('/api/asset-brands', assetBrandRoutes);
    app.use('/api/asset-categories', assetCategoryRoutes);
    app.use('/api/new-assets', newAssetRoutes);
    app.use('/api/new-asset-conditions', newAssetConditionRoutes);
    app.use('/api/log-maintenance', logMaintenanceRoutes);
    app.use('/api/asset-history', assetHistoryRoutes);
    app.use('/api/custom-events', customEventRoutes);
    app.use('/api/category-management-types', categoryManagementTypeRoutes);
    app.use('/api/main-category-managements', mainCategoryManagementRoutes);
    app.use('/api/main-footers', mainFooterRoutes);
    app.use('/api/sub-footers', subFooterRoutes);
    app.use('/api/footer-items', footerItemRoutes);
    app.use('/api/sliders', sliderRoutes);
    app.use('/api/slider-contents', sliderContentRoutes);
    app.use('/api/general-settings', generalSettingRoutes);
    app.use('/api/branding-appearances', brandingAppearanceRoutes);
    app.use('/api/authentication-securities', authenticationSecurityRoutes);
    app.use('/api/setting-role-permissions', settingRolePermissionRoutes);
    app.use('/api/notification-alerts', notificationAlertRoutes);
    app.use('/api/api-integrations', apiIntegrationRoutes);
    app.use('/api/data-management', dataManagementRoutes);
    app.use('/api/language-localization', languageLocalizationRoutes);
    app.use('/api/audit-logs', auditLogRoutes);
    app.use('/api/system-health', systemHealthRoutes);
    app.use('/api/asset-tags', assetTagRoutes);
    // Error handling middleware (must be after all routes)
    app.use((err, req, res, next) => {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';

      console.error('Error:', err);

      res.status(status).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
      });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
