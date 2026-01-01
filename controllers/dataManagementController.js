const DataManagement = require('../models/dataManagement');
const { getDocumentUrl } = require('../utils/uploadUtils');
const fs = require('fs');
const path = require('path');

exports.create = async (req, res) => {
    try {
        const { exportData, autoBackUpDate, dataRetentionPolicy } = req.body;

        let fileUrl = null;
        if (req.file) {
            fileUrl = getDocumentUrl(req.file.filename);
        }

        let validDate = null;
        if (autoBackUpDate) {
            const parsed = new Date(autoBackUpDate);
            if (isNaN(parsed.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid autoBackUpDate format. Please provide a valid date.'
                });
            }
            validDate = parsed;
        }

        const newItem = await DataManagement.create({
            file: fileUrl,
            exportData,
            autoBackUpDate: validDate,
            dataRetentionPolicy
        });

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        console.error('Create DataManagement Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create data management record',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const items = await DataManagement.findAll();
        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Get All DataManagement Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve records',
            error: error.message
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const item = await DataManagement.findById(req.params.id);
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
        console.error('Get By ID DataManagement Error:', error);
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
        const { exportData, autoBackUpDate, dataRetentionPolicy } = req.body;

        const existingItem = await DataManagement.findById(id);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        let fileUrl = existingItem.file;
        if (req.file) {
            // Delete old file if exists and different
            if (existingItem.file) {
                // Construct absolute path. Note: fileUrl is relative /uploads/documents/...
                // We need to strip the leading slash
                const oldPath = path.join(__dirname, '..', existingItem.file);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (err) {
                        console.error('Failed to delete old file:', err);
                    }
                }
            }
            fileUrl = getDocumentUrl(req.file.filename);
        }

        let validDate = undefined;
        if (autoBackUpDate) {
            const parsed = new Date(autoBackUpDate);
            if (isNaN(parsed.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid autoBackUpDate format. Please provide a valid date.'
                });
            }
            validDate = parsed;
        } else if (autoBackUpDate === null || autoBackUpDate === '') {
            validDate = null;
        }

        const updatedItem = await DataManagement.update(id, {
            file: fileUrl,
            exportData,
            autoBackUpDate: validDate,
            dataRetentionPolicy
        });

        res.status(200).json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        console.error('Update DataManagement Error:', error);
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
        const existingItem = await DataManagement.findById(id);

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Delete file
        if (existingItem.file) {
            const filePath = path.join(__dirname, '..', existingItem.file);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error('Failed to delete file:', err);
                }
            }
        }

        await DataManagement.delete(id);
        res.status(200).json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        console.error('Delete DataManagement Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete record',
            error: error.message
        });
    }
};
