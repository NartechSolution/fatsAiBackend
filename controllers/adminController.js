const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/emailUtils');

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OTP_EXPIRY_MINUTES = parseInt(process.env.ADMIN_LOGIN_OTP_EXPIRY_MINUTES || '5', 10);
const MAX_OTP_ATTEMPTS = parseInt(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || '5', 10);

// Admin signup controller
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, roleId, departmentId } = req.body;
    
    // Validate input
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Full name, email, password, and confirm password are required' 
      });
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Password and confirm password do not match' 
      });
    }
    
    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }
    
    // Check if email already exists
    const existingEmail = await Admin.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ 
        error: 'Email already in use' 
      });
    }
    
    // Generate username from email (before @ symbol) or use email
    let username = email.split('@')[0];
    
    // Check if username already exists
    const existingUsername = await Admin.findByUsername(username);
    if (existingUsername) {
      // If username exists, append a number
      let counter = 1;
      let newUsername = `${username}${counter}`;
      while (await Admin.findByUsername(newUsername)) {
        counter++;
        newUsername = `${username}${counter}`;
      }
      username = newUsername;
    }
    
    // Validate roleId if provided
    const prisma = require('../prisma/client');
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: parseInt(roleId) }
      });
      if (!role) {
        return res.status(400).json({ 
          error: 'Invalid role ID' 
        });
      }
    }
    
    // Validate departmentId if provided
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: parseInt(departmentId) }
      });
      if (!department) {
        return res.status(400).json({ 
          error: 'Invalid department ID' 
        });
      }
    }
    
    // Create new admin with inactive status (waiting for approval)
    const admin = await Admin.create({
      email,
      username,
      password,
      fullName,
      roleId: roleId || null,
      departmentId: departmentId || null,
      status: 'inactive' // Default to inactive, waiting for approval
    });
    
    // Return admin info (excluding password) - NO TOKEN since they need approval
    res.status(201).json({
      message: 'Admin registration submitted successfully. Your account is pending approval.',
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        fullName: admin.fullName,
        status: admin.status,
        roleId: admin.roleId,
        departmentId: admin.departmentId
      }
    });
  } catch (error) {
    console.error('Error during admin signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin login controller (now direct login without OTP)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Find admin by email
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Verify password
    const isPasswordValid = await Admin.verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Check if admin account is active
    if (admin.status !== 'active') {
      return res.status(403).json({ 
        error: 'Your account is pending approval. Please wait for administrator approval.' 
      });
    }

    // Directly generate JWT token and complete login (no OTP step)
    return generateTokenAndResponse(admin, res);
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify login OTP and finalize authentication
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required'
      });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin || !admin.loginOtp) {
      return res.status(400).json({
        error: 'OTP not found or already used'
      });
    }

    if (admin.loginOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        error: 'Maximum OTP attempts exceeded. Please restart login.'
      });
    }

    const isExpired = !admin.loginOtpExpiresAt || new Date(admin.loginOtpExpiresAt) < new Date();
    if (isExpired) {
      await Admin.clearLoginOtp(admin.id);
      return res.status(410).json({
        error: 'OTP expired. Please restart login.'
      });
    }

    if (admin.loginOtp !== otp) {
      const updatedAdmin = await Admin.incrementOtpAttempts(admin.id);
      const attemptsLeft = Math.max(0, MAX_OTP_ATTEMPTS - updatedAdmin.loginOtpAttempts);
      return res.status(401).json({
        error: 'Invalid OTP',
        attemptsLeft
      });
    }

    const sanitizedAdmin = await Admin.clearLoginOtp(admin.id);
    generateTokenAndResponse(sanitizedAdmin, res);
  } catch (error) {
    console.error('Error verifying admin login OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Resend login OTP
exports.resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(404).json({
        error: 'Admin not found'
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Admin.setLoginOtp(admin.id, otp, expiresAt);

    const emailResult = await sendOtpEmail({
      toEmail: admin.email,
      otp,
      expiresAt
    });

    if (emailResult?.error) {
      console.error('Failed to resend OTP email:', emailResult.details || emailResult.error);
      return res.status(500).json({ error: 'Unable to resend OTP email. Try again later.' });
    }

    res.status(200).json({
      message: 'OTP resent successfully. Please verify to complete login.',
      otpExpiresAt: expiresAt
    });
  } catch (error) {
    console.error('Error resending admin login OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to generate token and response
function generateTokenAndResponse(admin, res) {
  // Create JWT token
  const token = jwt.sign(
    { adminId: admin.id, email: admin.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Return admin info and token
  return res.status(200).json({
    message: 'Login successful',
    admin: {
      id: admin.id,
      email: admin.email,
      username: admin.username
    },
    token
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get current admin info
exports.getMe = async (req, res) => {
  try {
    // The admin ID comes from the authenticated request
    const adminId = req.admin.adminId;
    
    // Find admin by ID
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        error: 'Admin not found' 
      });
    }
    
    // Return admin info (excluding password)
    res.status(200).json({
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Error getting admin info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 