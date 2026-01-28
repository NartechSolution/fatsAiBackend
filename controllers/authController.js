const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { getImageUrl } = require('../utils/uploadUtils');
const { createError } = require('../utils/createError');
const { sendMultipleEmails, generateQRCode, convertEjsToPdf } = require('../utils/emailUtils');
const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const ejs = require('ejs');
const { logActivity } = require('../utils/auditLogger');

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:2507';

// Validation schema for comprehensive signup
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).optional(), // Made optional - will auto-generate if not provided
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  phoneNo: Joi.string().max(20).optional(),
  cr_number: Joi.string().max(100).optional(),
  tin_number: Joi.string().max(100).optional(),
  company_name_eng: Joi.string().max(500).optional(),
  company_name_arabic: Joi.string().max(500).optional(),
  company_landline: Joi.string().max(500).optional(),
  business_type: Joi.string().valid('organization', 'individual', 'family business').optional(),
  zip_code: Joi.string().max(50).optional(),
  industry_types: Joi.array().items(Joi.string()).optional(),
  country: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  city: Joi.string().max(100).optional(),
  membership_category: Joi.string().max(50).optional(),
  user_source: Joi.string().max(20).default('fatsAi'),
  plan_id: Joi.string().optional(),
  payment_method: Joi.string().optional(),
  notes: Joi.string().optional(),
  subscription_type: Joi.string().valid('free', 'paid').default('free'),
  isNfcEnable: Joi.boolean().default(false),
  nfcNumber: Joi.string().optional().allow(null),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  displayName: Joi.string().max(100).optional(),
  bio: Joi.string().optional(),
  language: Joi.string().max(10).optional(),
  emailNotification: Joi.boolean().default(true),
  smsAlert: Joi.boolean().default(false),
  pushNotification: Joi.boolean().default(true),
  buildingNumber: Joi.string().max(50).optional(),
  companySize: Joi.string().max(50).optional(),
  website: Joi.string().optional(),
  bAddress: Joi.string().optional(),
  bBuildingNumber: Joi.string().max(50).optional(),
  bCountry: Joi.string().max(100).optional(),
  bState: Joi.string().max(100).optional(),
  bCity: Joi.string().max(100).optional(),
  bZipCode: Joi.string().max(50).optional(),
  vatNumber: Joi.string().max(100).optional(),
  commercialRegistration: Joi.string().max(100).optional(),
  gps_location: Joi.string().optional(),
  latitude: Joi.string().optional(),
  longitude: Joi.string().optional(),
  cardNumber: Joi.string().max(20).optional(),
  cvc: Joi.string().max(4).optional(),
  expireDate: Joi.string().max(10).optional(),
  paymentType: Joi.string().valid('bankTransfer', 'creditCard', 'debitCard', 'paypal').default('bankTransfer').optional()
});

// Helper functions
const generateStrongPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const generateRandomTransactionId = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').toUpperCase();
};

const COMPANY_DETAILS = {
  title: "IoT Solutions Company",
  account_no: "IOT123456789",
  iban_no: "SA10 4500 0000 1234 5678 9012",
  bank_name: "Sample Bank",
  bank_swift_code: "SAMPBANK",
  bank_address: 'Sample Address, Sample City',
  phone: "9200-12345",
  email: "info@iotsolutions.com",
  crNumber: "1234567890",
  tinNumber: "123456789012345",
  website: "iotsolutions.com",
  CompanyURLS: {
    about: `${BACKEND_URL}/about`,
    services: `${BACKEND_URL}/services`,
    pricing: `${BACKEND_URL}/pricing`,
    support: `${BACKEND_URL}/support`,
    contact: `${BACKEND_URL}/contact`,
    privacy: `${BACKEND_URL}/privacy`,
    terms: `${BACKEND_URL}/terms`,
    help: `${BACKEND_URL}/help`
  }
};

// Simple Signup controller (original)
exports.signup = async (req, res) => {
  try {
    const { email, username, password, isNfcEnable, nfcNumber } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({
        error: 'Email, username, and password are required'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email already in use'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        error: 'Username already taken'
      });
    }

    // Check if NFC number is already in use (if provided and NFC is enabled)
    // If isNfcEnable is false, we won't check for NFC number uniqueness
    if (nfcNumber && (isNfcEnable === true || isNfcEnable === undefined)) {
      const existingNfc = await User.findByNfcNumber(nfcNumber);
      if (existingNfc) {
        return res.status(400).json({
          error: 'NFC number already in use'
        });
      }
    }

    // Create new user - if isNfcEnable is false, set nfcNumber to null regardless of input
    const user = await User.create({
      email,
      username,
      password,
      isNfcEnable: isNfcEnable || false,
      nfcNumber: isNfcEnable === false ? null : (nfcNumber || null)
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info (excluding password) and token
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isNfcEnable: user.isNfcEnable,
        nfcNumber: user.nfcNumber
      },
      token
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Comprehensive Signup controller with subscription and email functionality
exports.createUser = async (req, res, next) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) throw createError(400, error.details[0].message);

    const { plan_id, payment_method, notes, subscription_type, industry_types, ...userData } = value;

    // Handle industry_types conversion to JSON string
    if (industry_types) {
      userData.industry_types = JSON.stringify(industry_types);
    }

    // Check for existing user with email, username, cr_number, or tin_number
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username },
          ...(userData.cr_number ? [{ cr_number: userData.cr_number }] : []),
          ...(userData.tin_number ? [{ tin_number: userData.tin_number }] : []),
        ],
      },
    });

    if (existingUser) {
      const errorMessages = [];

      // Check each field and provide specific error messages
      if (existingUser.email === userData.email) {
        errorMessages.push('Email already exists');
      }
      if (existingUser.username === userData.username) {
        errorMessages.push('Username already exists');
      }
      if (userData.cr_number && existingUser.cr_number === userData.cr_number) {
        errorMessages.push('CR number already exists');
      }
      if (userData.tin_number && existingUser.tin_number === userData.tin_number) {
        errorMessages.push('TIN number already exists');
      }

      // Throw an error with the detailed conflict messages
      throw createError(409, errorMessages.join(', '));
    }

    // Check if NFC number is already in use (if provided and NFC is enabled)
    if (userData.nfcNumber && userData.isNfcEnable) {
      const existingNfc = await prisma.user.findFirst({
        where: {
          nfcNumber: userData.nfcNumber,
          isNfcEnable: true
        }
      });
      if (existingNfc) {
        throw createError(409, 'NFC number already in use');
      }
    }

    // Generate password and store both plain and hashed versions
    const plainPassword = userData.password || generateStrongPassword(8);
    userData.password = hashPassword(plainPassword);

    // Set company name from firstName + lastName if not provided
    if (!userData.company_name_eng && userData.firstName && userData.lastName) {
      userData.company_name_eng = `${userData.firstName} ${userData.lastName}`;
    }

    const currentDate = new Date();
    const expiryDate = new Date(currentDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Generate transaction ID for subscription (not stored in user table)
    const transactionId = generateRandomTransactionId(10);

    // Handle subscription plan - plan_id is now required
    if (!plan_id) {
      throw createError(400, 'plan_id is required for all user registrations');
    }

    let subscriptionPlan = null;
    let isFreeplan = subscription_type === 'free';

    // Find the specified plan
    subscriptionPlan = await prisma.subscriptionPlan.findFirst({
      where: { id: plan_id, isActive: true },
      include: {
        plan_services: {
          where: { isIncluded: true },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                display_name: true,
                description: true,
                service_type: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!subscriptionPlan) {
      throw createError(400, 'Invalid or inactive subscription plan');
    }

    // Determine if it's a free plan based on subscription_type OR price
    isFreeplan = subscription_type === 'free' || Number(subscriptionPlan.price) === 0;

    // Calculate amount_paid automatically
    const amount_paid = isFreeplan ? 0 : Number(subscriptionPlan.price);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: userData,
      });

      let userSubscription = null;
      if (subscriptionPlan) {
        userSubscription = await tx.userSubscription.create({
          data: {
            userId: newUser.id,
            planId: plan_id,
            status: 'active',
            startedAt: currentDate,
            expiresAt: expiryDate,
            paymentStatus: isFreeplan ? 'paid' : 'pending',
            amountPaid: amount_paid,
            paymentMethod: isFreeplan ? 'free' : payment_method,
            transactionId: transactionId,
            notes: notes || null,
          },
        });
      }

      return { user: newUser, subscription: userSubscription };
    }, {
      timeout: 30000, // Increase timeout to 30 seconds
    });

    let pdfFilePath = null;
    let pdfFilename = null;
    let pdfGenerationResult = { success: true, error: null, message: 'PDF not required for free plan' };

    // Only generate invoice for paid subscriptions
    if (!isFreeplan && subscriptionPlan) {
      // Properly structure the invoice data with services
      const invoiceData = {
        user: result.user,
        subscription: {
          ...result.subscription,
          plan: subscriptionPlan,
          services: subscriptionPlan.plan_services.map(planService => planService.service),
        },
        company_details: COMPANY_DETAILS,
        qrCodeDataURL: await generateQRCode(transactionId),
        BACKEND_URL: BACKEND_URL,
        topHeading: 'Invoice'
      };

      // Generate PDF Invoice
      const pdfDir = path.join(__dirname, '../uploads/documents/MemberRegInvoice');
      if (!fsSync.existsSync(pdfDir)) fsSync.mkdirSync(pdfDir, { recursive: true });

      pdfFilename = `Invoice-${result.user.company_name_eng?.replace(/[^a-zA-Z0-9]/g, '_') || 'User'}-${transactionId}-${Date.now()}.pdf`;
      pdfFilePath = path.join(pdfDir, pdfFilename);

      const pdfDirectory = path.join(
        __dirname,
        "..",
        "views",
        "pdf",
        "Invoice",
        "printpackInvoice.ejs"
      );

      pdfGenerationResult = { success: false, error: null };
      try {
        await convertEjsToPdf(pdfDirectory, invoiceData, pdfFilePath);

        // Verify PDF was created successfully
        if (!fsSync.existsSync(pdfFilePath)) {
          throw new Error(`PDF generation failed - file not created at ${pdfFilePath}`);
        }

        // Create document record outside of transaction
        await prisma.memberDocument.create({
          data: {
            documentPath: `/uploads/documents/MemberRegInvoice/${pdfFilename}`,
            transactionId: transactionId,
            userId: result.user.id,
            docType: 'invoice',
            status: 'inactive',
          },
        });

        pdfGenerationResult = { success: true, error: null };
      } catch (pdfError) {
        pdfGenerationResult = {
          success: false,
          error: {
            message: 'PDF generation failed',
            details: pdfError.message,
            type: 'PDF_GENERATION_ERROR'
          }
        };
        // Set pdfFilePath to null so email won't try to attach non-existent file
        pdfFilePath = null;
        pdfFilename = null;
      }
    }

    // Prepare simplified email template data
    const emailTemplateData = {
      user: result.user,
      subscription: result.subscription ? {
        ...result.subscription,
        plan: subscriptionPlan,
        services: subscriptionPlan?.plan_services?.map(planService => planService.service) || [],
      } : null,
      company_details: COMPANY_DETAILS,
      BACKEND_URL: BACKEND_URL,
      generatedPassword: plainPassword,
      isFreeplan: isFreeplan,
      subscription_type: subscription_type,
    };

    // Path to the simple email template
    const emailTemplatePath = path.join(
      __dirname,
      "..",
      "views",
      "emails",
      "registration",
      "welcomeEmail.ejs"
    );

    // Generate HTML content from EJS template
    const htmlContent = await ejs.renderFile(emailTemplatePath, emailTemplateData);

    // Prepare email subject
    const emailSubject = isFreeplan
      ? `Welcome to IoT Solutions - Your Free Account is Active!`
      : `Welcome to IoT Solutions - Registration Confirmation`;

    // Prepare email attachments
    const emailAttachments = [];
    if (!isFreeplan && pdfFilePath) {
      emailAttachments.push({
        filename: pdfFilename,
        content: await fs.readFile(pdfFilePath),
        contentType: 'application/pdf',
      });
    }

    // Send email with credentials and invoice
    let emailResult = { success: false, error: null };
    try {
      const emailResponse = await sendMultipleEmails({
        emailData: [
          {
            toEmail: result.user.email,
            subject: emailSubject,
            htmlContent: htmlContent,
            attachments: emailAttachments,
          },
        ],
      });

      if (emailResponse && !emailResponse.emailSkipped) {
        emailResult = { success: true, error: null };
      } else {
        emailResult = {
          success: false,
          error: {
            message: 'Email sending failed',
            details: emailResponse?.details || emailResponse?.error || 'Unknown email error',
            type: 'EMAIL_SENDING_ERROR'
          }
        };
      }
    } catch (error) {
      emailResult = {
        success: false,
        error: {
          message: 'Email sending failed',
          details: error.message,
          type: 'EMAIL_SENDING_ERROR'
        }
      };
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user_id: result.user.id,
        transaction_id: transactionId,
        plan_name: subscriptionPlan?.displayName || subscriptionPlan?.name || 'No Plan',
        subscription_type: subscription_type,
        is_free_plan: isFreeplan,
        pdf_generation: !isFreeplan ? pdfGenerationResult : { success: true, error: null, message: 'PDF not required for free plan' },
        email_sending: emailResult,
        invoice_generated: !isFreeplan && pdfGenerationResult.success,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        company_name_eng: result.user.company_name_eng,
        isNfcEnable: result.user.isNfcEnable,
        nfcNumber: result.user.nfcNumber
      },
      token
    });
  } catch (error) {
    console.error('Create User Error:', error);

    // Return structured JSON error response
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'User creation failed',
      error: {
        message: error.message || 'Internal server error',
        type: error.name || 'UNKNOWN_ERROR',
        code: error.code || null,
        details: error.details || null
      }
    });
  }
};

// Login controller (traditional login with email/password)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate token and send response
    generateTokenAndResponse(user, res);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// NFC login controller - separate endpoint specifically for NFC login
exports.loginWithNfc = async (req, res) => {
  try {
    const { nfcNumber } = req.body;

    // Validate input
    if (!nfcNumber) {
      return res.status(400).json({
        error: 'NFC number is required'
      });
    }

    // Find user by NFC number
    const user = await User.findByNfcNumber(nfcNumber);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid NFC card'
      });
    }

    // Check if NFC login is enabled for this user
    if (!user.isNfcEnable) {
      return res.status(401).json({
        error: 'NFC login is not enabled for this user'
      });
    }

    // Generate token and send response
    generateTokenAndResponse(user, res);
  } catch (error) {
    console.error('Error during NFC login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to generate token and response
function generateTokenAndResponse(user, res) {
  // Create JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Return user info and token
  return res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isNfcEnable: user.isNfcEnable,
      nfcNumber: user.nfcNumber
    },
    token
  });

  // Log the successful login (fire and forget)
  logActivity('User Login', user.id, user.username, 'Success', 'User logged in successfully');

  return response;
}

// Get current user info
exports.getMe = async (req, res) => {
  try {
    // The user ID comes from the authenticated request
    const userId = req.user.userId;

    // Find user by ID with subscription information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Include active subscription with plan and services
        user_subscriptions: {
          where: { status: "active" },
          include: {
            plan: {
              include: {
                plan_services: {
                  include: {
                    service: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Process subscription and documents data to make it more readable
    const userResponse = { ...user };

    // Format subscription data if available
    if (user.user_subscriptions && user.user_subscriptions.length > 0) {
      const subscription = user.user_subscriptions[0];
      userResponse.subscription = {
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
          description: subscription.plan.description,
          price: subscription.plan.price,
          billingCycle: subscription.plan.billingCycle,
          isPopular: subscription.plan.isPopular
        },
        services: subscription.plan.plan_services
          .filter(ps => ps.isIncluded)
          .map(ps => ({
            id: ps.service.id,
            name: ps.service.name,
            displayName: ps.service.display_name,
            description: ps.service.description,
            serviceType: ps.service.service_type,
            icon: ps.service.icon,
            isActive: ps.service.is_active
          })),
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
        paymentStatus: subscription.paymentStatus
      };

      // Remove the nested structure to clean up response
      delete userResponse.user_subscriptions;
    } else {
      userResponse.subscription = null;
    }

    // Get documents directly using the user_id field
    const documents = await prisma.memberDocument.findMany({
      where: {
        userId: userId,
        // status: "active",
        deletedAt: null
      }
    });

    // Format documents data
    if (documents && documents.length > 0) {
      userResponse.documents = documents.map(doc => ({
        id: doc.id,
        documentPath: doc.documentPath,
        transactionId: doc.transactionId,
        docType: doc.docType,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
    } else {
      userResponse.documents = [];
    }

    // Return user info with subscription and documents data
    res.status(200).json({
      user: userResponse
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update NFC settings
exports.updateNfcSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isNfcEnable, nfcNumber } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // If NFC is being disabled, automatically set nfcNumber to null
    let updatedNfcNumber = nfcNumber;
    if (isNfcEnable === false) {
      updatedNfcNumber = null;
    } else if (nfcNumber && nfcNumber !== user.nfcNumber) {
      // Only check for existing NFC if NFC is enabled and number is changing
      const existingNfc = await User.findByNfcNumber(nfcNumber);
      if (existingNfc) {
        return res.status(400).json({
          error: 'NFC number already in use'
        });
      }
    }

    // Update user NFC settings
    const updatedUser = await User.updateById(userId, {
      isNfcEnable: isNfcEnable !== undefined ? isNfcEnable : user.isNfcEnable,
      nfcNumber: isNfcEnable === false ? null : (updatedNfcNumber !== undefined ? updatedNfcNumber : user.nfcNumber)
    });

    res.status(200).json({
      message: 'NFC settings updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        isNfcEnable: updatedUser.isNfcEnable,
        nfcNumber: updatedUser.nfcNumber
      }
    });
  } catch (error) {
    console.error('Error updating NFC settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile with optional fields
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      firstName,
      lastName,
      cr_number,
      cr_activity,
      company_name_eng,
      company_name_arabic,
      company_landline,
      business_type,
      zip_code,
      industry_types,
      country,
      state,
      city,
      membership_category,
      user_source,
      tin_number,
      gps_location,
      latitude,
      longitude,
      phoneNo,
      dateOfBirth,
      gender,
      displayName,
      bio,
      language,
      emailNotification,
      smsAlert,
      pushNotification,
      buildingNumber,
      companySize,
      website,
      bAddress,
      bBuildingNumber,
      bCountry,
      bState,
      bCity,
      bZipCode,
      vatNumber,
      commercialRegistration,
      cardNumber,
      cvc,
      expireDate,
      paymentType
    } = req.body;

    // Handle uploaded image file - store full path
    const image = req.file ? getImageUrl(req.file.filename) : undefined;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Helper function to convert string booleans to actual booleans
    const convertToBoolean = (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
      }
      return null; // Invalid value
    };

    // Validate and convert boolean notification fields
    let convertedEmailNotification, convertedSmsAlert, convertedPushNotification;

    if (emailNotification !== undefined) {
      convertedEmailNotification = convertToBoolean(emailNotification);
      if (convertedEmailNotification === null) {
        return res.status(400).json({
          error: 'emailNotification must be a boolean value (true or false)'
        });
      }
    }

    if (smsAlert !== undefined) {
      convertedSmsAlert = convertToBoolean(smsAlert);
      if (convertedSmsAlert === null) {
        return res.status(400).json({
          error: 'smsAlert must be a boolean value (true or false)'
        });
      }
    }

    if (pushNotification !== undefined) {
      convertedPushNotification = convertToBoolean(pushNotification);
      if (convertedPushNotification === null) {
        return res.status(400).json({
          error: 'pushNotification must be a boolean value (true or false)'
        });
      }
    }

    // Prepare update data - only include fields that are provided
    const updateData = {};

    // Add fields to update data only if they are provided in the request
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (cr_number !== undefined) updateData.cr_number = cr_number;
    if (cr_activity !== undefined) updateData.cr_activity = cr_activity;
    if (company_name_eng !== undefined) updateData.company_name_eng = company_name_eng;
    if (company_name_arabic !== undefined) updateData.company_name_arabic = company_name_arabic;
    if (company_landline !== undefined) updateData.company_landline = company_landline;
    if (business_type !== undefined) updateData.business_type = business_type;
    if (zip_code !== undefined) updateData.zip_code = zip_code;
    if (industry_types !== undefined) updateData.industry_types = industry_types;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (membership_category !== undefined) updateData.membership_category = membership_category;
    if (user_source !== undefined) updateData.user_source = user_source;
    if (tin_number !== undefined) updateData.tin_number = tin_number;
    if (image !== undefined) updateData.image = image;
    if (gps_location !== undefined) updateData.gps_location = gps_location;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Additional profile fields
    if (phoneNo !== undefined) updateData.phoneNo = phoneNo;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (language !== undefined) updateData.language = language;
    if (emailNotification !== undefined) updateData.emailNotification = convertedEmailNotification;
    if (smsAlert !== undefined) updateData.smsAlert = convertedSmsAlert;
    if (pushNotification !== undefined) updateData.pushNotification = convertedPushNotification;
    if (buildingNumber !== undefined) updateData.buildingNumber = buildingNumber;
    if (companySize !== undefined) updateData.companySize = companySize;
    if (website !== undefined) updateData.website = website;
    if (bAddress !== undefined) updateData.bAddress = bAddress;
    if (bBuildingNumber !== undefined) updateData.bBuildingNumber = bBuildingNumber;
    if (bCountry !== undefined) updateData.bCountry = bCountry;
    if (bState !== undefined) updateData.bState = bState;
    if (bCity !== undefined) updateData.bCity = bCity;
    if (bZipCode !== undefined) updateData.bZipCode = bZipCode;
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber;
    if (commercialRegistration !== undefined) updateData.commercialRegistration = commercialRegistration;
    if (cardNumber !== undefined) updateData.cardNumber = cardNumber;
    if (cvc !== undefined) updateData.cvc = cvc;
    if (expireDate !== undefined) updateData.expireDate = expireDate;
    if (paymentType !== undefined) updateData.paymentType = paymentType;

    // Validate business_type if provided
    if (business_type && !['organization', 'individual', 'family business'].includes(business_type)) {
      return res.status(400).json({
        error: 'Invalid business_type. Must be one of: organization, individual, family business'
      });
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid gender. Must be one of: male, female, other'
      });
    }

    // Validate paymentType if provided
    if (paymentType && !['bankTransfer', 'creditCard', 'debitCard', 'paypal'].includes(paymentType)) {
      return res.status(400).json({
        error: 'Invalid paymentType. Must be one of: bankTransfer, creditCard, debitCard, paypal'
      });
    }

    // Validate dateOfBirth format if provided
    if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
      return res.status(400).json({
        error: 'Invalid dateOfBirth format. Please provide a valid date'
      });
    }

    // Validate industry_types if provided (should be valid JSON string)
    if (industry_types) {
      try {
        JSON.parse(industry_types);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid industry_types format. Must be a valid JSON string'
        });
      }
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields provided for update'
      });
    }

    // Update user profile
    const updatedUser = await User.updateById(userId, updateData);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        isNfcEnable: updatedUser.isNfcEnable,
        nfcNumber: updatedUser.nfcNumber,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        cr_number: updatedUser.cr_number,
        cr_activity: updatedUser.cr_activity,
        company_name_eng: updatedUser.company_name_eng,
        company_name_arabic: updatedUser.company_name_arabic,
        company_landline: updatedUser.company_landline,
        business_type: updatedUser.business_type,
        zip_code: updatedUser.zip_code,
        industry_types: updatedUser.industry_types,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        membership_category: updatedUser.membership_category,
        user_source: updatedUser.user_source,
        tin_number: updatedUser.tin_number,
        image: updatedUser.image,
        gps_location: updatedUser.gps_location,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        phoneNo: updatedUser.phoneNo,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        language: updatedUser.language,
        emailNotification: updatedUser.emailNotification,
        smsAlert: updatedUser.smsAlert,
        pushNotification: updatedUser.pushNotification,
        buildingNumber: updatedUser.buildingNumber,
        companySize: updatedUser.companySize,
        website: updatedUser.website,
        bAddress: updatedUser.bAddress,
        bBuildingNumber: updatedUser.bBuildingNumber,
        bCountry: updatedUser.bCountry,
        bState: updatedUser.bState,
        bCity: updatedUser.bCity,
        bZipCode: updatedUser.bZipCode,
        vatNumber: updatedUser.vatNumber,
        commercialRegistration: updatedUser.commercialRegistration,
        cardNumber: updatedUser.cardNumber,
        cvc: updatedUser.cvc,
        expireDate: updatedUser.expireDate,
        paymentType: updatedUser.paymentType
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};