const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Template upload configurations
const templateUploadConfigs = {
  template1: [
    { name: "hero_background", path: "uploads/images/blogImages" },
    { name: "section_2_image", path: "uploads/images/blogImages" },
    { name: "section_3_image", path: "uploads/images/blogImages" },
  ],
  template2: [
    { name: "hero_background", path: "uploads/images/blogImages" },
    { name: "section_2_image", path: "uploads/images/blogImages" },
    { name: "section_3_image", path: "uploads/images/blogImages" },
  ],
  template3: [
    { name: "hero_background", path: "uploads/images/blogImages" },
    { name: "section_2_image", path: "uploads/images/blogImages" },
    { name: "section_3_image", path: "uploads/images/blogImages" },
  ],
  template4: [
    { name: "hero_background", path: "uploads/images/blogImages" },
    { name: "section_2_image", path: "uploads/images/blogImages" },
    { name: "section_3_image", path: "uploads/images/blogImages" },
  ],
  template5: [
    { name: "hero_background", path: "uploads/images/blogImages" },
    { name: "section_image", path: "uploads/images/blogImages" },
    { name: "section_3_image", path: "uploads/images/blogImages" },
  ],
  template6: [
    { name: "hero_background", path: "uploads/images/blogImages" },
    { name: "section_image", path: "uploads/images/blogImages" },
    { name: "section_3_image", path: "uploads/images/blogImages" },
  ],
  template7: [
    { name: "carousel_images_0", path: "uploads/images/blogImages" },
    { name: "carousel_images_1", path: "uploads/images/blogImages" },
    { name: "carousel_images_2", path: "uploads/images/blogImages" },
    { name: "carousel_images_3", path: "uploads/images/blogImages" },
    { name: "carousel_images_4", path: "uploads/images/blogImages" },
    { name: "section_image", path: "uploads/images/blogImages" },
    { name: "section_3_image", path: "uploads/images/blogImages" },
  ],
  cv_template: [
    { name: "profile_image", path: "uploads/images/blogImages" },
  ],
};

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..','uploads', 'images', 'blogImages');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// File filter function to restrict file types
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to determine upload fields based on template
const determineUploadFields = (req, res, next) => {
  console.log(req.query.template_name);
  const { template_name } = req.query;

  if (!template_name) {
    return res.status(400).json({ error: "Template name is required" });
  }

  const uploadFields = templateUploadConfigs[template_name];

  if (!uploadFields) {
    return res.status(400).json({ error: "Invalid template name" });
  }

  req.uploadFields = uploadFields;
  next();
};

// Dynamic upload middleware
const dynamicUpload = (req, res, next) => {
  const uploadFields = req.uploadFields;
  
  // Convert to multer fields format
  const multerFields = uploadFields.map(field => ({
    name: field.name,
    maxCount: 1
  }));
  
  upload.fields(multerFields)(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// @route   POST /api/pages
// @desc    Create a new page
// @access  Private/Admin
router.post(
  '/',
  verifyToken,
  determineUploadFields,
  dynamicUpload,
  pageController.createPage
);

// @route   PUT /api/pages/:id
// @desc    Update an existing page
// @access  Private/Admin
router.put(
  '/',
  verifyToken,
  determineUploadFields,
  dynamicUpload,
  pageController.updatePage
);

// @route   GET /api/pages
// @desc    Get all pages
// @access  Public
router.get('/', pageController.getNewPages);

// @route   GET /api/pages/by-slug
// @desc    Get page by slug
// @access  Public
router.get('/by-slug', pageController.getPage);

// @route   GET /api/pages/templates
// @desc    Get all templates
// @access  Public
router.get('/templates', pageController.getTemplates);

// @route   DELETE /api/pages/:id
// @desc    Delete a page
// @access  Private/Admin
router.delete('/:id', verifyToken, pageController.deletePage);

module.exports = router;