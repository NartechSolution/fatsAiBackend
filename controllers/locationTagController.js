const LocationTag = require('../models/locationTag');

// Helper function to generate location code from components
function generateLocationCode(company, building, level, officeRoom) {
  // Clean and format each component
  const cleanCompany = company.trim().toUpperCase().replace(/\s+/g, '-');
  const cleanBuilding = building.trim().toUpperCase();
  const cleanLevel = level.trim().toUpperCase();
  const cleanOfficeRoom = officeRoom.trim().toUpperCase();
  
  // Generate location code: COMPANY-BUILDING-LEVEL-OFFICEROOM
  return `${cleanCompany}-${cleanBuilding}-L${cleanLevel}-${cleanOfficeRoom}`;
}

// Controller for handling location tag-related operations
const locationTagController = {
  // Create a new location tag
  async createLocationTag(req, res) {
    try {
      const { company, building, level, officeRoom } = req.body;
      
      // Check if all required fields are provided
      if (!company || !building || !level || !officeRoom) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required: company, building, level, officeRoom' 
        });
      }
      
      // Generate location code automatically
      const locationCode = generateLocationCode(company, building, level, officeRoom);
      
      // Check if location code already exists
      const existingLocationTag = await LocationTag.getByCode(locationCode);
      if (existingLocationTag) {
        return res.status(400).json({ 
          success: false, 
          message: 'Location tag with this code already exists' 
        });
      }
      
      // Create new location tag
      const newLocationTag = await LocationTag.create({
        company,
        building,
        level,
        officeRoom,
        locationCode
      });
      
      res.status(201).json({
        success: true,
        message: 'Location tag created successfully',
        data: newLocationTag
      });
    } catch (error) {
      console.error('Error creating location tag:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create location tag', 
        error: error.message 
      });
    }
  },

  // Get all location tags
  async getAllLocationTags(req, res) {
    try {
      const locationTags = await LocationTag.getAll();
      
      res.status(200).json({
        success: true,
        count: locationTags.length,
        data: locationTags
      });
    } catch (error) {
      console.error('Error fetching location tags:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch location tags', 
        error: error.message 
      });
    }
  },

  // Get location tag by ID
  async getLocationTagById(req, res) {
    try {
      const { id } = req.params;
      
      const locationTag = await LocationTag.getById(id);
      
      if (!locationTag) {
        return res.status(404).json({ 
          success: false, 
          message: 'Location tag not found' 
        });
      }
      
      res.status(200).json({
        success: true,
        data: locationTag
      });
    } catch (error) {
      console.error('Error fetching location tag:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch location tag', 
        error: error.message 
      });
    }
  },

  // Update location tag
  async updateLocationTag(req, res) {
    try {
      const { id } = req.params;
      const { company, building, level, officeRoom } = req.body;
      
      // Check if location tag exists
      const locationTag = await LocationTag.getById(id);
      if (!locationTag) {
        return res.status(404).json({ 
          success: false, 
          message: 'Location tag not found' 
        });
      }
      
      // Prepare update data
      const updateData = {};
      if (company !== undefined) updateData.company = company;
      if (building !== undefined) updateData.building = building;
      if (level !== undefined) updateData.level = level;
      if (officeRoom !== undefined) updateData.officeRoom = officeRoom;
      
      // If any component changed, regenerate location code
      if (company || building || level || officeRoom) {
        const newCompany = company || locationTag.company;
        const newBuilding = building || locationTag.building;
        const newLevel = level || locationTag.level;
        const newOfficeRoom = officeRoom || locationTag.officeRoom;
        
        const newLocationCode = generateLocationCode(newCompany, newBuilding, newLevel, newOfficeRoom);
        
        // Check if new location code already exists (and it's not the current one)
        if (newLocationCode !== locationTag.locationCode) {
          const existingLocationTag = await LocationTag.getByCode(newLocationCode);
          if (existingLocationTag) {
            return res.status(400).json({ 
              success: false, 
              message: 'Location code already in use' 
            });
          }
        }
        
        updateData.locationCode = newLocationCode;
      }
      
      // Update location tag
      const updatedLocationTag = await LocationTag.update(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Location tag updated successfully',
        data: updatedLocationTag
      });
    } catch (error) {
      console.error('Error updating location tag:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update location tag', 
        error: error.message 
      });
    }
  },

  // Delete location tag
  async deleteLocationTag(req, res) {
    try {
      const { id } = req.params;
      
      // Check if location tag exists
      const locationTag = await LocationTag.getById(id);
      if (!locationTag) {
        return res.status(404).json({ 
          success: false, 
          message: 'Location tag not found' 
        });
      }
      
      // Delete location tag
      await LocationTag.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Location tag deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting location tag:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete location tag', 
        error: error.message 
      });
    }
  }
};

module.exports = locationTagController;
