const Languages = require('../models/languages');
const createError = require('../utils/createError');
const prisma = require('../prisma/client');
const ExcelJS = require('exceljs');

// Get all translations as a key-value object
exports.translations = async (req, res, next) => {
  try {
    const allLanguages = await prisma.languages.findMany();

    // Create an empty object to store the formatted data
    let formattedData = {};

    // Loop through the data and populate the formatted object
    allLanguages.forEach(item => {
      formattedData[item.key] = item.value;
    });

    res.json(formattedData);
  } catch (error) {
    next(error);
  }
};

// Export translations to a formatted Excel file
exports.exportTranslationsToExcel = async (req, res, next) => {
  try {
    const allLanguages = await prisma.languages.findMany({
      orderBy: { key: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Translations');

    worksheet.columns = [
      { header: 'key', key: 'key', width: 40 },
      { header: 'value', key: 'value', width: 60 }
    ];

    allLanguages.forEach((item) => {
      worksheet.addRow({
        key: item.key,
        value: item.value
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="translations-template.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Import translations from an Excel file
exports.importTranslationsFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'Excel file is required'));
    }

    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return next(createError(400, 'Excel file is empty or invalid'));
    }

    // Expect headers in first row: key, value
    const headerRow = worksheet.getRow(1);
    const keyColIndex = headerRow.values.findIndex(
      (v) => v && v.toString().trim().toLowerCase() === 'key'
    );
    const valueColIndex = headerRow.values.findIndex(
      (v) => v && v.toString().trim().toLowerCase() === 'value'
    );

    if (keyColIndex === -1 || valueColIndex === -1) {
      return next(
        createError(
          400,
          "Invalid header format. Required columns: 'key', 'value' in the first row."
        )
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Start from row 2 (after header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const key = row.getCell(keyColIndex).value
        ? row.getCell(keyColIndex).value.toString().trim()
        : '';
      const value = row.getCell(valueColIndex).value
        ? row.getCell(valueColIndex).value.toString().trim()
        : '';

      if (!key || !value) {
        skippedCount++;
        continue;
      }

      // Upsert by key
      const existing = await prisma.languages.findUnique({
        where: { key }
      });

      if (existing) {
        await prisma.languages.update({
          where: { id: existing.id },
          data: { value }
        });
        updatedCount++;
      } else {
        await prisma.languages.create({
          data: { key, value }
        });
        createdCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Translations imported successfully',
      summary: {
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new language entry
exports.createLanguage = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    
    // Validate required fields
    if (!key || !value) {
      return next(createError(400, 'Key and value are required'));
    }
    
    // Check if key already exists
    const existingLanguage = await Languages.findByKey(key);
    if (existingLanguage) {
      return next(createError(400, `Language key '${key}' already exists`));
    }
    
    const languageData = {
      key,
      value
    };
    
    const language = await Languages.create(languageData);
    
    res.status(201).json({
      success: true,
      data: language
    });
  } catch (error) {
    next(error);
  }
};

// Get all language entries
exports.getAllLanguages = async (req, res, next) => {
  try {
    const languages = await Languages.findAll();
    
    res.status(200).json({
      success: true,
      count: languages.length,
      data: languages
    });
  } catch (error) {
    next(error);
  }
};

// Get a single language entry by ID
exports.getLanguageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const language = await Languages.findById(id);
    
    if (!language) {
      return next(createError(404, `Language with id ${id} not found`));
    }
    
    res.status(200).json({
      success: true,
      data: language
    });
  } catch (error) {
    next(error);
  }
};

// Get a single language entry by key
exports.getLanguageByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    const language = await Languages.findByKey(key);
    
    if (!language) {
      return next(createError(404, `Language with key '${key}' not found`));
    }
    
    res.status(200).json({
      success: true,
      data: language
    });
  } catch (error) {
    next(error);
  }
};

// Update a language entry
exports.updateLanguage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { key, value } = req.body;
    
    // Check if language exists
    const existingLanguage = await Languages.findById(id);
    
    if (!existingLanguage) {
      return next(createError(404, `Language with id ${id} not found`));
    }
    
    // If key is being changed, check if new key already exists
    if (key && key !== existingLanguage.key) {
      const keyExists = await Languages.findByKey(key);
      if (keyExists) {
        return next(createError(400, `Language key '${key}' already exists`));
      }
    }
    
    // Update language data
    const updatedLanguage = await Languages.update(id, {
      key: key || existingLanguage.key,
      value: value || existingLanguage.value
    });
    
    res.status(200).json({
      success: true,
      data: updatedLanguage
    });
  } catch (error) {
    next(error);
  }
};

// Delete a language entry
exports.deleteLanguage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if language exists
    const language = await Languages.findById(id);
    
    if (!language) {
      return next(createError(404, `Language with id ${id} not found`));
    }
    
    await Languages.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Language entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
