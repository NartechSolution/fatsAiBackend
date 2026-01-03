const express = require('express');
const router = express.Router();
const languageLocalizationController = require('../controllers/languageLocalizationController');

// Routes
router.post('/', languageLocalizationController.create);
router.get('/', languageLocalizationController.getAll);
router.get('/:id', languageLocalizationController.getById);
router.put('/:id', languageLocalizationController.update);
router.delete('/:id', languageLocalizationController.delete);

module.exports = router;
