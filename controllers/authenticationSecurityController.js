const authenticationSecurityModel = require('../models/authenticationSecurity');
const { createError } = require('../utils/createError');

// Get all AuthenticationSecurities
const getAllAuthenticationSecurities = async (req, res, next) => {
  try {
    const authenticationSecurities = await authenticationSecurityModel.getAllAuthenticationSecurities();
    
    res.status(200).json({
      success: true,
      data: authenticationSecurities
    });
  } catch (error) {
    next(createError(500, 'Error retrieving authentication securities'));
  }
};

// Get AuthenticationSecurity by ID
const getAuthenticationSecurityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authenticationSecurity = await authenticationSecurityModel.getAuthenticationSecurityById(id);
    
    if (!authenticationSecurity) {
      return next(createError(404, 'Authentication security not found'));
    }
    
    res.status(200).json({
      success: true,
      data: authenticationSecurity
    });
  } catch (error) {
    next(createError(500, 'Error retrieving authentication security'));
  }
};

// Create new AuthenticationSecurity
const createAuthenticationSecurity = async (req, res, next) => {
  try {
    const { 
      loginMethod,
      minPasswordLength,
      passwordExpiry,
      reqSpecialCharacter,
      twoFactorAuth,
      twoFAMethod,
      sessionTime,
      autoLogout,
      loginAttemptLimit,
      lockOutDuration,
      rememberMe,
      userRegistration,
      emailVerificationReq
    } = req.body;
    
    // Convert boolean strings to booleans
    const convertToBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    // Convert number strings to numbers
    const convertToNumber = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    // Prepare data for database
    const authenticationSecurityData = {
      loginMethod,
      minPasswordLength: convertToNumber(minPasswordLength),
      passwordExpiry: convertToNumber(passwordExpiry),
      reqSpecialCharacter: convertToBoolean(reqSpecialCharacter),
      twoFactorAuth: convertToBoolean(twoFactorAuth),
      twoFAMethod,
      sessionTime: convertToNumber(sessionTime),
      autoLogout: convertToBoolean(autoLogout),
      loginAttemptLimit: convertToNumber(loginAttemptLimit),
      lockOutDuration: convertToNumber(lockOutDuration),
      rememberMe: convertToBoolean(rememberMe),
      userRegistration: convertToBoolean(userRegistration),
      emailVerificationReq: convertToBoolean(emailVerificationReq),
    };
    
    const newAuthenticationSecurity = await authenticationSecurityModel.createAuthenticationSecurity(authenticationSecurityData);
    
    res.status(201).json({
      success: true,
      data: newAuthenticationSecurity
    });
  } catch (error) {
    console.error('Error creating authentication security:', error);
    next(createError(500, `Error creating authentication security: ${error.message}`));
  }
};

// Update AuthenticationSecurity
const updateAuthenticationSecurity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      loginMethod,
      minPasswordLength,
      passwordExpiry,
      reqSpecialCharacter,
      twoFactorAuth,
      twoFAMethod,
      sessionTime,
      autoLogout,
      loginAttemptLimit,
      lockOutDuration,
      rememberMe,
      userRegistration,
      emailVerificationReq
    } = req.body;
    
    // Check if AuthenticationSecurity exists
    const existingAuthenticationSecurity = await authenticationSecurityModel.getAuthenticationSecurityById(id);
    if (!existingAuthenticationSecurity) {
      return next(createError(404, 'Authentication security not found'));
    }
    
    // Convert boolean strings to booleans
    const convertToBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    // Convert number strings to numbers
    const convertToNumber = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    // Prepare data for database
    const authenticationSecurityData = {
      loginMethod,
      minPasswordLength: minPasswordLength !== undefined ? convertToNumber(minPasswordLength) : undefined,
      passwordExpiry: passwordExpiry !== undefined ? convertToNumber(passwordExpiry) : undefined,
      reqSpecialCharacter: reqSpecialCharacter !== undefined ? convertToBoolean(reqSpecialCharacter) : undefined,
      twoFactorAuth: twoFactorAuth !== undefined ? convertToBoolean(twoFactorAuth) : undefined,
      twoFAMethod,
      sessionTime: sessionTime !== undefined ? convertToNumber(sessionTime) : undefined,
      autoLogout: autoLogout !== undefined ? convertToBoolean(autoLogout) : undefined,
      loginAttemptLimit: loginAttemptLimit !== undefined ? convertToNumber(loginAttemptLimit) : undefined,
      lockOutDuration: lockOutDuration !== undefined ? convertToNumber(lockOutDuration) : undefined,
      rememberMe: rememberMe !== undefined ? convertToBoolean(rememberMe) : undefined,
      userRegistration: userRegistration !== undefined ? convertToBoolean(userRegistration) : undefined,
      emailVerificationReq: emailVerificationReq !== undefined ? convertToBoolean(emailVerificationReq) : undefined,
    };
    
    const updatedAuthenticationSecurity = await authenticationSecurityModel.updateAuthenticationSecurity(id, authenticationSecurityData);
    
    res.status(200).json({
      success: true,
      data: updatedAuthenticationSecurity
    });
  } catch (error) {
    console.error('Error updating authentication security:', error);
    next(createError(500, `Error updating authentication security: ${error.message}`));
  }
};

// Delete AuthenticationSecurity
const deleteAuthenticationSecurity = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if AuthenticationSecurity exists
    const existingAuthenticationSecurity = await authenticationSecurityModel.getAuthenticationSecurityById(id);
    if (!existingAuthenticationSecurity) {
      return next(createError(404, 'Authentication security not found'));
    }
    
    // Delete the AuthenticationSecurity
    await authenticationSecurityModel.deleteAuthenticationSecurity(id);
    
    res.status(200).json({
      success: true,
      message: 'Authentication security deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting authentication security:', error);
    next(createError(500, `Error deleting authentication security: ${error.message}`));
  }
};

module.exports = {
  getAllAuthenticationSecurities,
  getAuthenticationSecurityById,
  createAuthenticationSecurity,
  updateAuthenticationSecurity,
  deleteAuthenticationSecurity
};

