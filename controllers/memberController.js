const prisma = require('../prisma/client');
const { createError } = require('../utils/createError');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../utils/auditLogger');

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
    if (status) {
      subscriptionWhere.status = status;
    }

    // Plan filter
    if (planId) {
      subscriptionWhere.planId = planId;
    }

    // Get total count
    const totalMembers = await prisma.user.count({
      where
    });

    // Get members with subscriptions and invoices
    const members = await prisma.user.findMany({
      where,
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

    // SQL Server Prisma: `distinct` is not supported in `.count()`.
    // So we count USERS via relation filters instead.
    const activeMembers = await prisma.user.count({
      where: { user_subscriptions: { some: { status: 'active' } } }
    });

    const pendingMembers = await prisma.user.count({
      where: { user_subscriptions: { some: { status: 'pending' } } }
    });

    const inactiveSubscriptions = await prisma.user.count({
      where: { user_subscriptions: { some: { status: 'inactive' } } }
    });

    // Count users without any subscription
    const usersWithoutSubscription = await prisma.user.count({
      where: {
        user_subscriptions: {
          none: {}
        }
      }
    });

    const inactiveMembers = inactiveSubscriptions + usersWithoutSubscription;

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
    logActivity('Member Status Updated', adminId, member.email, 'Success', `Member ${member.email} status updated to ${status}`);

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
    if (status) {
      subscriptionWhere.status = status;
    }
    if (planId) {
      subscriptionWhere.planId = planId;
    }

    // Get all members matching criteria
    const members = await prisma.user.findMany({
      where,
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

    // Construct full file path
    const filePath = path.join(__dirname, '..', invoiceDocument.documentPath);

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
