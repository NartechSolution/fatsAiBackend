const prisma = require('../prisma/client');

// Get all AuthenticationSecurities
const getAllAuthenticationSecurities = async () => {
  return await prisma.authenticationSecurity.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get AuthenticationSecurity by ID
const getAuthenticationSecurityById = async (id) => {
  return await prisma.authenticationSecurity.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create new AuthenticationSecurity
const createAuthenticationSecurity = async (data) => {
  return await prisma.authenticationSecurity.create({
    data: {
      loginMethod: data.loginMethod,
      minPasswordLength: data.minPasswordLength !== undefined ? data.minPasswordLength : 8,
      passwordExpiry: data.passwordExpiry,
      reqSpecialCharacter: data.reqSpecialCharacter !== undefined ? data.reqSpecialCharacter : false,
      twoFactorAuth: data.twoFactorAuth !== undefined ? data.twoFactorAuth : false,
      twoFAMethod: data.twoFAMethod,
      sessionTime: data.sessionTime,
      autoLogout: data.autoLogout !== undefined ? data.autoLogout : false,
      loginAttemptLimit: data.loginAttemptLimit !== undefined ? data.loginAttemptLimit : 5,
      lockOutDuration: data.lockOutDuration,
      rememberMe: data.rememberMe !== undefined ? data.rememberMe : false,
      userRegistration: data.userRegistration !== undefined ? data.userRegistration : false,
      emailVerificationReq: data.emailVerificationReq !== undefined ? data.emailVerificationReq : false,
    },
  });
};

// Update AuthenticationSecurity
const updateAuthenticationSecurity = async (id, data) => {
  const updateData = {
    loginMethod: data.loginMethod,
    minPasswordLength: data.minPasswordLength,
    passwordExpiry: data.passwordExpiry,
    reqSpecialCharacter: data.reqSpecialCharacter,
    twoFactorAuth: data.twoFactorAuth,
    twoFAMethod: data.twoFAMethod,
    sessionTime: data.sessionTime,
    autoLogout: data.autoLogout,
    loginAttemptLimit: data.loginAttemptLimit,
    lockOutDuration: data.lockOutDuration,
    rememberMe: data.rememberMe,
    userRegistration: data.userRegistration,
    emailVerificationReq: data.emailVerificationReq,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  return await prisma.authenticationSecurity.update({
    where: {
      id: parseInt(id),
    },
    data: updateData,
  });
};

// Delete AuthenticationSecurity
const deleteAuthenticationSecurity = async (id) => {
  return await prisma.authenticationSecurity.delete({
    where: {
      id: parseInt(id),
    },
  });
};

module.exports = {
  getAllAuthenticationSecurities,
  getAuthenticationSecurityById,
  createAuthenticationSecurity,
  updateAuthenticationSecurity,
  deleteAuthenticationSecurity,
};

