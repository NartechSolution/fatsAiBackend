const express = require('express');
const router = express.Router();
const languagesController = require('../controllers/languagesController');
const { verifyToken } = require('../middleware/auth');
const { uploadDocuments } = require('../utils/uploadUtils');

// Create a new language entry - protected route
router.post('/', verifyToken, languagesController.createLanguage);

// Get all language entries - public route
router.get('/', languagesController.getAllLanguages);

// Get all translations as a key-value object - public route
router.get('/translations', languagesController.translations);

// Export translations to a formatted Excel file - protected route
router.get(
  '/translations/export-excel',
  verifyToken,
  languagesController.exportTranslationsToExcel
);

// Import translations from Excel file - protected route
router.post(
  '/translations/import-excel',
  verifyToken,
  uploadDocuments.single('file'),
  languagesController.importTranslationsFromExcel
);

// Get a single language entry by ID - public route
router.get('/id/:id', languagesController.getLanguageById);

// Get a single language entry by key - public route
router.get('/key/:key', languagesController.getLanguageByKey);

// Update a language entry - protected route
router.put('/:id', verifyToken, languagesController.updateLanguage);

// Delete a language entry - protected route
router.delete('/:id', verifyToken, languagesController.deleteLanguage);

module.exports = router;
