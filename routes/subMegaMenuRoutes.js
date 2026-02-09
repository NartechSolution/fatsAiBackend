const express = require('express');
const router = express.Router();
const subMegaMenuController = require('../controllers/subMegaMenuController');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/submegamenu
// @desc    Create a new sub mega menu
// @access  Private
router.post('/', verifyToken, subMegaMenuController.uploadSubMegaMenuImage, subMegaMenuController.createSubMegaMenu);

// @route   GET /api/submegamenu
// @desc    Get all sub mega menus
// @access  Public
router.get('/', subMegaMenuController.getAllSubMegaMenus);

// @route   GET /api/submegamenu/megamenu/:megamenu_id
// @desc    Get sub mega menus by mega menu ID
// @access  Public
router.get('/megamenu/:megamenu_id', subMegaMenuController.getSubMegaMenusByMegaMenuId);

// @route   GET /api/submegamenu/:id
// @desc    Get a single sub mega menu
// @access  Public
router.get('/:id', subMegaMenuController.getSubMegaMenu);

// @route   PUT /api/submegamenu/:id
// @desc    Update a sub mega menu
// @access  Private
router.put('/:id', verifyToken, subMegaMenuController.uploadSubMegaMenuImage, subMegaMenuController.updateSubMegaMenu);

// @route   DELETE /api/submegamenu/:id
// @desc    Delete a sub mega menu
// @access  Private
router.delete('/:id', verifyToken, subMegaMenuController.deleteSubMegaMenu);

module.exports = router; 