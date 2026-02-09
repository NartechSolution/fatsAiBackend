const express = require('express');
const router = express.Router();
const megaMenuController = require('../controllers/megaMenuController');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/megamenu
// @desc    Create a new mega menu
// @access  Private
router.post('/', verifyToken, megaMenuController.uploadMegaMenuIcon, megaMenuController.createMegaMenu);

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
router.put('/:id', verifyToken, megaMenuController.uploadMegaMenuIcon, megaMenuController.updateMegaMenu);

// @route   DELETE /api/megamenu/:id
// @desc    Delete a mega menu
// @access  Private
router.delete('/:id', verifyToken, megaMenuController.deleteMegaMenu);

module.exports = router; 