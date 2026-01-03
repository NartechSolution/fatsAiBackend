const LanguageLocalization = require('../models/languageLocalization');

exports.create = async (req, res) => {
    try {
        const { defaultLanguage, RTLSupport, currencySymbol, unitSystem } = req.body;

        // Validate Enums
        if (currencySymbol && !['left', 'right'].includes(currencySymbol)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid currencySymbol. Must be "left" or "right".'
            });
        }

        if (unitSystem && !['metric', 'imperial'].includes(unitSystem)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unitSystem. Must be "metric" or "imperial".'
            });
        }

        const newItem = await LanguageLocalization.create({
            defaultLanguage,
            RTLSupport: RTLSupport === 'true' || RTLSupport === true,
            currencySymbol: currencySymbol || 'left',
            unitSystem: unitSystem || 'metric'
        });

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        console.error('Create LanguageLocalization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create language localization record',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const items = await LanguageLocalization.findAll();
        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Get All LanguageLocalization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve records',
            error: error.message
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const item = await LanguageLocalization.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }
        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Get By ID LanguageLocalization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve record',
            error: error.message
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { defaultLanguage, RTLSupport, currencySymbol, unitSystem } = req.body;

        const existingItem = await LanguageLocalization.findById(id);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Validate Enums
        if (currencySymbol && !['left', 'right'].includes(currencySymbol)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid currencySymbol. Must be "left" or "right".'
            });
        }

        if (unitSystem && !['metric', 'imperial'].includes(unitSystem)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unitSystem. Must be "metric" or "imperial".'
            });
        }

        const updatedItem = await LanguageLocalization.update(id, {
            defaultLanguage,
            RTLSupport: RTLSupport !== undefined ? (RTLSupport === 'true' || RTLSupport === true) : undefined,
            currencySymbol,
            unitSystem
        });

        res.status(200).json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        console.error('Update LanguageLocalization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update record',
            error: error.message
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const existingItem = await LanguageLocalization.findById(id);

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        await LanguageLocalization.delete(id);
        res.status(200).json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        console.error('Delete LanguageLocalization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete record',
            error: error.message
        });
    }
};
