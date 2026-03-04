const prisma = require('../prisma/client');
const { createError } = require('../utils/createError');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/auditLogger');
const { getDocumentUrl } = require('../utils/uploadUtils');
const { sendMultipleEmails } = require('../utils/emailUtils');
const notificationModel = require('../models/notification');

// JWT configuration (keep in sync with authController)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d';

/**
 * Get members list with pagination, search, and filtering
 * GET /api/auth/members
 */
exports.getMembers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '', // Filter by subscription status: active, pending, inactive
      planId = '', // Filter by subscription plan ID
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Normalize status to lowercase so "Inactive", "INACTIVE" etc. all work
    const normalizedStatus =
      typeof status === 'string' ? status.toLowerCase() : '';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    // Search filter (searches in company name, full name, email)
    if (search) {
      where.OR = [
        { company_name_eng: { contains: search } },
        { company_name_arabic: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } }
      ];
    }

    // Status filter - filter by subscription status
    let subscriptionWhere = {};
    if (normalizedStatus && ['active', 'pending', 'inactive'].includes(normalizedStatus)) {
      subscriptionWhere.status = normalizedStatus;
    }

    // Plan filter
    if (planId) {
      subscriptionWhere.planId = planId;
    }

    // Build user-level where with subscription filters
    let userWhere = { ...where };

    const hasSubscriptionFilter = Object.keys(subscriptionWhere).length > 0;

    if (normalizedStatus === 'inactive' && !planId) {
      // Inactive members are:
      // - users with at least one inactive subscription
      // - OR users with no subscriptions at all
      userWhere = {
        ...where,
        OR: [
          { user_subscriptions: { some: { status: 'inactive' } } },
          { user_subscriptions: { none: {} } }
        ]
      };
    } else if (hasSubscriptionFilter) {
      // For active/pending or when filtering by plan, require matching subscription
      userWhere = {
        ...where,
        user_subscriptions: { some: subscriptionWhere }
      };
    }

    // Get total count
    const totalMembers = await prisma.user.count({
      where: userWhere
    });

    // Get members with subscriptions and invoices
    const members = await prisma.user.findMany({
      where: userWhere,
      skip,
      take: limitNum,
      include: {
        user_subscriptions: {
          where: subscriptionWhere,
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                displayName: true,
                price: true,
                billingCycle: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Get the most recent subscription
        },
        documents_owned: {
          where: {
            docType: 'invoice',
            deletedAt: null
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Get the most recent invoice
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Format response
    const formattedMembers = members.map((member, index) => {
      const subscription = member.user_subscriptions?.[0];
      const invoice = member.documents_owned?.[0];
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username;
      
      return {
        sNo: skip + index + 1,
        id: member.id,
        companyName: member.company_name_eng || member.company_name_arabic || 'N/A',
        fullName: fullName,
        corporateEmail: member.email,
        subscriptionPlan: subscription?.plan ? {
          id: subscription.plan.id,
          name: subscription.plan.displayName || subscription.plan.name,
          price: subscription.plan.price,
          billingCycle: subscription.plan.billingCycle
        } : null,
        invoice: invoice ? {
          id: invoice.id,
          documentPath: invoice.documentPath,
          transactionId: invoice.transactionId,
          hasInvoice: true
        } : {
          hasInvoice: false
        },
        status: subscription?.status || 'inactive',
        paymentStatus: subscription?.paymentStatus || 'pending',
        paymentSlipe: member.paymentSlipe,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      data: formattedMembers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMembers,
        totalPages: Math.ceil(totalMembers / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
};

/**
 * Get member statistics summary
 * GET /api/auth/members/summary
 */
exports.getMembersSummary = async (req, res) => {
  try {
    // Get total members count
    const totalMembers = await prisma.user.count();

    // Users with at least one inactive subscription
    const inactiveSubscriptions = await prisma.user.count({
      where: { user_subscriptions: { some: { status: 'inactive' } } }
    });

    // Users without any subscription
    const usersWithoutSubscription = await prisma.user.count({
      where: {
        user_subscriptions: {
          none: {}
        }
      }
    });

    // Final inactive members bucket:
    // - users with any inactive subscription
    // - OR users with no subscriptions at all
    const inactiveMembers = inactiveSubscriptions + usersWithoutSubscription;

    // Pending members:
    // - have at least one subscription with paymentStatus = 'pending'
    // - are NOT already classified as inactive (no inactive subscriptions)
    const pendingMembers = await prisma.user.count({
      where: {
        user_subscriptions: {
          some: { paymentStatus: 'pending' },
          none: { status: 'inactive' }
        }
      }
    });

    // Active members:
    // everything else that is not inactive or pending
    const activeMembers = totalMembers - inactiveMembers - pendingMembers;

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        pendingMembers,
        inactiveMembers
      }
    });
  } catch (error) {
    console.error('Error fetching members summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members summary',
      error: error.message
    });
  }
};

/**
 * Get single member details
 * GET /api/auth/members/:id
 */
exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        user_subscriptions: {
          include: {
            plan: {
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
                        icon: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        documents_owned: {
          where: {
            deletedAt: null
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const activeSubscription = member.user_subscriptions.find(sub => sub.status === 'active') || 
                              member.user_subscriptions[0];

    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username;

    const formattedMember = {
      id: member.id,
      companyName: member.company_name_eng || member.company_name_arabic || 'N/A',
      companyNameArabic: member.company_name_arabic,
      fullName: fullName,
      firstName: member.firstName,
      lastName: member.lastName,
      corporateEmail: member.email,
      username: member.username,
      phoneNo: member.phoneNo,
      companyLandline: member.company_landline,
      crNumber: member.cr_number,
      tinNumber: member.tin_number,
      businessType: member.business_type,
      country: member.country,
      state: member.state,
      city: member.city,
      zipCode: member.zip_code,
      industryTypes: member.industry_types ? JSON.parse(member.industry_types) : [],
      membershipCategory: member.membership_category,
      image: member.image,
      paymentSlipe: member.paymentSlipe,
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        plan: {
          id: activeSubscription.plan.id,
          name: activeSubscription.plan.displayName || activeSubscription.plan.name,
          price: activeSubscription.plan.price,
          billingCycle: activeSubscription.plan.billingCycle
        },
        services: activeSubscription.plan.plan_services.map(ps => ({
          id: ps.service.id,
          name: ps.service.name,
          displayName: ps.service.display_name,
          description: ps.service.description,
          serviceType: ps.service.service_type,
          icon: ps.service.icon
        })),
        status: activeSubscription.status,
        paymentStatus: activeSubscription.paymentStatus,
        startedAt: activeSubscription.startedAt,
        expiresAt: activeSubscription.expiresAt,
        transactionId: activeSubscription.transactionId,
        amountPaid: activeSubscription.amountPaid,
        paymentMethod: activeSubscription.paymentMethod
      } : null,
      documents: member.documents_owned.map(doc => ({
        id: doc.id,
        documentPath: doc.documentPath,
        transactionId: doc.transactionId,
        docType: doc.docType,
        status: doc.status,
        createdAt: doc.createdAt
      })),
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    };

    res.status(200).json({
      success: true,
      data: formattedMember
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member details',
      error: error.message
    });
  }
};

/**
 * Update member information
 * PUT /api/auth/members/:id
 */
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Handle industry_types conversion if provided
    if (updateData.industry_types && Array.isArray(updateData.industry_types)) {
      updateData.industry_types = JSON.stringify(updateData.industry_types);
    }

    // Remove fields that shouldn't be updated directly
    const { planId, subscriptionStatus, ...userUpdateData } = updateData;

    // Update user
    const updatedMember = await prisma.user.update({
      where: { id },
      data: userUpdateData,
      include: {
        user_subscriptions: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                displayName: true,
                price: true,
                billingCycle: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Log activity
    const adminId = req.admin?.adminId || 'system';
    logActivity('Member Updated', adminId, updatedMember.email, 'Success', `Member ${updatedMember.email} updated`);

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: updatedMember
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: error.message
    });
  }
};

/**
 * Update member subscription status
 * PUT /api/auth/members/:id/status
 */
exports.updateMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!status || !['active', 'pending', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (active, pending, inactive)'
      });
    }

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        user_subscriptions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Update the most recent subscription
    if (member.user_subscriptions.length > 0) {
      const subscriptionId = member.user_subscriptions[0].id;
      const updateData = { status };
      
      if (paymentStatus && ['pending', 'paid', 'failed'].includes(paymentStatus)) {
        updateData.paymentStatus = paymentStatus;
      }

      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: updateData
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Member has no subscription to update'
      });
    }

    // Log activity
    const adminId = req.admin?.adminId || 'system';
    logActivity(
      'Member Status Updated',
      adminId,
      member.email,
      'Success',
      `Member ${member.email} status updated to ${status}`
    );

    // Send email + in-app notification about status / payment change (non-blocking)
    (async () => {
      try {
        const memberDisplayName =
          `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
          member.company_name_eng ||
          member.username ||
          'Member';

        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        const paymentStatusLabel = paymentStatus
          ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)
          : null;

        const lines = [
          `<p>Dear ${memberDisplayName},</p>`,
          `<p>Your membership status has been updated to <strong>${statusLabel}</strong>.</p>`
        ];

        if (paymentStatusLabel) {
          lines.push(
            `<p>Your payment status is now: <strong>${paymentStatusLabel}</strong>.</p>`
          );
        }

        lines.push(
          '<p>If you have any questions, please contact support.</p>',
          '<p>Best regards,<br/>Support Team</p>'
        );

        await sendMultipleEmails({
          emailData: [
            {
              toEmail: member.email,
              subject: 'Your membership status has been updated',
              htmlContent: lines.join('')
            }
          ]
        });

        // Create in-app notifications related to status / payment change
        const notifications = [];

        // Member notification about status/payment change
        const baseMessage = paymentStatusLabel
          ? `Your membership is now ${statusLabel} and payment status is ${paymentStatusLabel}.`
          : `Your membership is now ${statusLabel}.`;

        let severity = 'info';
        if (status === 'active') severity = 'success';
        else if (status === 'inactive') severity = 'warning';

        notifications.push({
          title: 'Membership status updated',
          message: baseMessage,
          type: 'membership',
          severity,
          targetRole: 'member',
          userId: member.id,
          link: '/member/profile' // adjust to your member profile/membership page
        });

        // Optional admin notification when payment marked as paid/failed
        if (paymentStatus && ['paid', 'failed'].includes(paymentStatus)) {
          const adminSeverity = paymentStatus === 'paid' ? 'success' : 'warning';
          const adminTitle =
            paymentStatus === 'paid'
              ? 'Member payment marked as paid'
              : 'Member payment update';

          notifications.push({
            title: adminTitle,
            message: `Payment status for member ${member.email} is now ${paymentStatusLabel}.`,
            type: 'payment',
            severity: adminSeverity,
            targetRole: 'admin',
            adminId: null,
            link: '/admin/members'
          });
        }

        await notificationModel.createManyNotifications(notifications);
      } catch (notifyError) {
        console.error('Failed to send member status update notifications:', notifyError);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Member status updated successfully'
    });
  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member status',
      error: error.message
    });
  }
};

/**
 * Delete member
 * DELETE /api/auth/members/:id
 */
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Delete member (cascade will delete subscriptions and documents)
    await prisma.user.delete({
      where: { id }
    });

    // Log activity
    const adminId = req.admin?.adminId || 'system';
    logActivity('Member Deleted', adminId, member.email, 'Success', `Member ${member.email} deleted`);

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete member',
      error: error.message
    });
  }
};

/**
 * Export members list
 * GET /api/auth/members/export
 */
exports.exportMembers = async (req, res) => {
  try {
    const { search = '', status = '', planId = '' } = req.query;

    // Normalize status to lowercase so "Inactive", "INACTIVE" etc. all work
    const normalizedStatus =
      typeof status === 'string' ? status.toLowerCase() : '';

    // Build where clause (same as getMembers)
    const where = {};

    if (search) {
      where.OR = [
        { company_name_eng: { contains: search } },
        { company_name_arabic: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } }
      ];
    }

    let subscriptionWhere = {};
    if (normalizedStatus && ['active', 'pending', 'inactive'].includes(normalizedStatus)) {
      subscriptionWhere.status = normalizedStatus;
    }
    if (planId) {
      subscriptionWhere.planId = planId;
    }

    let userWhere = { ...where };
    const hasSubscriptionFilter = Object.keys(subscriptionWhere).length > 0;

    if (normalizedStatus === 'inactive' && !planId) {
      userWhere = {
        ...where,
        OR: [
          { user_subscriptions: { some: { status: 'inactive' } } },
          { user_subscriptions: { none: {} } }
        ]
      };
    } else if (hasSubscriptionFilter) {
      userWhere = {
        ...where,
        user_subscriptions: { some: subscriptionWhere }
      };
    }

    // Get all members matching criteria
    const members = await prisma.user.findMany({
      where: userWhere,
      include: {
        user_subscriptions: {
          where: subscriptionWhere,
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                displayName: true,
                price: true,
                billingCycle: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format data for CSV
    const csvRows = [];
    csvRows.push([
      'S.No',
      'Company Name',
      'Full Name',
      'Corporate Email',
      'Subscription Plan',
      'Price',
      'Billing Cycle',
      'Status',
      'Payment Status',
      'Created At'
    ]);

    members.forEach((member, index) => {
      const subscription = member.user_subscriptions?.[0];
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username;
      const planName = subscription?.plan?.displayName || subscription?.plan?.name || 'N/A';
      const price = subscription?.plan?.price || '0';
      const billingCycle = subscription?.plan?.billingCycle || 'N/A';
      const status = subscription?.status || 'inactive';
      const paymentStatus = subscription?.paymentStatus || 'pending';

      csvRows.push([
        index + 1,
        member.company_name_eng || member.company_name_arabic || 'N/A',
        fullName,
        member.email,
        planName,
        price,
        billingCycle,
        status,
        paymentStatus,
        member.createdAt.toISOString()
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=members-export-${Date.now()}.csv`);
    
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export members',
      error: error.message
    });
  }
};

/**
 * Get member invoice
 * GET /api/auth/members/:id/invoice
 */
exports.getMemberInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        user_subscriptions: {
          include: {
            plan: {
              include: {
                plan_services: {
                  where: { isIncluded: true },
                  include: {
                    service: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        documents_owned: {
          where: {
            docType: 'invoice',
            deletedAt: null
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const subscription = member.user_subscriptions?.[0];
    const invoiceDocument = member.documents_owned?.[0];

    if (!invoiceDocument) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found for this member'
      });
    }

    // Construct full file path.
    // NOTE: `documentPath` is stored like `/uploads/...` (leading slash).
    // On Windows, `path.join(__dirname, '..', '/uploads/...')` ignores previous segments,
    // resulting in `C:\uploads\...` which doesn't exist in this project.
    const backendRoot = path.resolve(__dirname, '..');
    const relativeDocumentPath = String(invoiceDocument.documentPath || '')
      .replace(/^[/\\]+/, '') // drop any leading "/" or "\"
      .replace(/\0/g, ''); // basic null-byte hardening
    const filePath = path.resolve(backendRoot, relativeDocumentPath);

    // Prevent path traversal outside backend root
    if (!filePath.startsWith(backendRoot + path.sep) && filePath !== backendRoot) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice path'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found'
      });
    }

    // Get transaction ID from document or subscription
    const transactionId = invoiceDocument.transactionId || subscription?.transactionId || 'unknown';

    // Send the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${member.company_name_eng?.replace(/[^a-zA-Z0-9]/g, '_') || 'member'}-${transactionId}.pdf`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      console.error('Error reading invoice file:', err);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to read invoice file'
        });
      }
      res.end();
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

/**
 * Upload or update member payment slip
 * POST /api/auth/members/:id/payment-slip
 * Form field: paymentSlipe (file)
 */
exports.uploadPaymentSlipe = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure file is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'paymentSlipe file is required'
      });
    }

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Build document URL/path for stored file
    const paymentSlipePath = getDocumentUrl(req.file.filename);

    // Update member with payment slip path (optional field)
    const updatedMember = await prisma.user.update({
      where: { id },
      data: {
        paymentSlipe: paymentSlipePath
      }
    });

    // Log activity
    const adminId = req.admin?.adminId || 'system';
    logActivity(
      'Member Payment Slip Uploaded',
      adminId,
      updatedMember.email,
      'Success',
      `Payment slip uploaded for member ${updatedMember.email}`
    );

    // Send email and in-app notifications to member and admin (non-blocking for main flow)
    (async () => {
      try {
        const adminNotificationEmail =
          process.env.ADMIN_EMAIL || process.env.DEMO_EMAIL_TO || 'info@gstsa1.org';

        const memberDisplayName =
          `${updatedMember.firstName || ''} ${updatedMember.lastName || ''}`.trim() ||
          updatedMember.company_name_eng ||
          updatedMember.username ||
          'Member';

        const emailPayload = {
          emailData: [
            {
              toEmail: updatedMember.email,
              subject: 'Your payment slip has been received',
              htmlContent: `
                <p>Dear ${memberDisplayName},</p>
                <p>Your payment slip has been uploaded successfully and has been sent to our team for review.</p>
                <p>We will notify you once your payment has been verified.</p>
                <p>Best regards,<br/>Support Team</p>
              `
            },
            {
              toEmail: adminNotificationEmail,
              subject: 'New member payment slip uploaded',
              htmlContent: `
                <p>A member has uploaded a new payment slip.</p>
                <ul>
                  <li>User ID: ${updatedMember.id}</li>
                  <li>Email: ${updatedMember.email}</li>
                  <li>Company: ${
                    updatedMember.company_name_eng ||
                    updatedMember.company_name_arabic ||
                    'N/A'
                  }</li>
                </ul>
                <p>Please log in to the admin panel to review and process this payment.</p>
              `
            }
          ]
        };

        await sendMultipleEmails(emailPayload);

        // Create in-app notifications for member and a generic admin notification
        const notifications = [];

        // Member notification (visible in member portal)
        notifications.push({
          title: 'Payment slip uploaded',
          message:
            'Your payment slip has been received and sent for review. You will be notified once it is verified.',
          type: 'payment',
          severity: 'info',
          targetRole: 'member',
          userId: updatedMember.id,
          link: '/member/billing' // adjust to your member notification/payment page route
        });

        // Admin notification (visible in admin portal)
        notifications.push({
          title: 'New member payment slip uploaded',
          message: `Member ${updatedMember.email} has uploaded a new payment slip.`,
          type: 'payment',
          severity: 'warning',
          targetRole: 'admin',
          adminId: null, // optional: attach to a specific admin id if you have it in context
          link: '/admin/members' // adjust to your admin members/payment review page route
        });

        await notificationModel.createManyNotifications(notifications);
      } catch (notifyError) {
        console.error('Failed to send payment slip notification emails:', notifyError);
      }
    })();

    return res.status(200).json({
      success: true,
      message: 'Payment slip uploaded successfully',
      data: {
        id: updatedMember.id,
        paymentSlipe: updatedMember.paymentSlipe
      }
    });
  } catch (error) {
    console.error('Error uploading payment slip:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload payment slip',
      error: error.message
    });
  }
};

/**
 * Admin impersonates a member (login as member)
 * POST /api/auth/members/:id/impersonate
 * Requires a valid admin JWT (verifyAdminToken middleware)
 */
exports.impersonateMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure this is called by an authenticated admin
    if (!req.admin || !req.admin.adminId) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const member = await prisma.user.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Create a JWT for the selected member, tagging who impersonated them
    const tokenPayload = {
      userId: member.id,
      email: member.email,
      impersonatedBy: req.admin.adminId,
      impersonatedAt: new Date().toISOString()
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    // Log audit trail
    logActivity(
      'Admin Impersonate Member',
      req.admin.adminId,
      member.email,
      'Success',
      `Admin logged in as member ${member.email}`
    );

    return res.status(200).json({
      success: true,
      message: 'Impersonation login token generated successfully',
      token,
      member: {
        id: member.id,
        email: member.email,
        username: member.username,
        firstName: member.firstName,
        lastName: member.lastName
      }
    });
  } catch (error) {
    console.error('Error impersonating member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to login as member',
      error: error.message
    });
  }
};
