const express = require('express');
const router = express.Router();
const megaMenuController = require('../controllers/megaMenuController');
const { verifyAdminToken } = require('../middleware/auth');

// @route   POST /api/megamenu
// @desc    Create a new mega menu
// @access  Private
router.post('/', verifyAdminToken, megaMenuController.uploadMegaMenuIcon, megaMenuController.createMegaMenu);

// @route   GET /api/megamenu
// @desc    Get all mega menus
// @access  Public
router.get('/', megaMenuController.getAllMegaMenus);

// @route   GET /api/megamenu/:id
// @desc    Get a single mega menu
// @access  Public
router.get('/:id', megaMenuController.getMegaMenu);

// @route   PUT /api/megamenu/:id
// @desc    Update a mega menu
// @access  Private
router.put('/:id', verifyAdminToken, megaMenuController.uploadMegaMenuIcon, megaMenuController.updateMegaMenu);

// @route   DELETE /api/megamenu/:id
// @desc    Delete a mega menu
// @access  Private
router.delete('/:id', verifyAdminToken, megaMenuController.deleteMegaMenu);

module.exports = router; 