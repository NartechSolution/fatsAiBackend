const Country = require('../models/country');

exports.createCountry = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'name and code are required',
      });
    }

    const country = await Country.create({ name, code });

    return res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country,
    });
  } catch (error) {
    console.error('Error creating country:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create country',
      error: error.message,
    });
  }
};

exports.getAllCountries = async (req, res) => {
  try {
    const countries = await Country.findAll();
    return res.status(200).json({
      success: true,
      message: 'Countries retrieved successfully',
      data: countries,
    });
  } catch (error) {
    console.error('Error retrieving countries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve countries',
      error: error.message,
    });
  }
};

exports.getCountryById = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findById(id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Country retrieved successfully',
      data: country,
    });
  } catch (error) {
    console.error('Error retrieving country:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve country',
      error: error.message,
    });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const existing = await Country.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Country not found',
      });
    }

    const country = await Country.update(id, {
      ...(name !== undefined ? { name } : {}),
      ...(code !== undefined ? { code } : {}),
    });

    return res.status(200).json({
      success: true,
      message: 'Country updated successfully',
      data: country,
    });
  } catch (error) {
    console.error('Error updating country:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update country',
      error: error.message,
    });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Country.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Country not found',
      });
    }

    await Country.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Country deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting country:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete country',
      error: error.message,
    });
  }
};
