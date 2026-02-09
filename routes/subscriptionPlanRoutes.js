const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const subscriptionPlanController = require('../controllers/subscriptionPlanController');
const { verifyToken } = require('../middleware/auth');

// Validation rules
const subscriptionPlanValidation = [
  check('name', 'Name is required').not().isEmpty().isString().trim(),
  check('nameAr', 'Name Arabic must be a string').optional().isString().trim(),
  check('displayName', 'Display name is required').not().isEmpty().isString().trim(),
  check('displayNameAr', 'Display name Arabic must be a string').optional().isString().trim(),
  check('description', 'Description must be a string').optional().isString().trim(),
  check('descriptionAr', 'Description Arabic must be a string').optional().isString().trim(),
  check('price', 'Price is required and must be a number').isNumeric(),
  check('billingCycle', 'Billing cycle is required').optional().isString().trim(),
  check('isPopular', 'Is popular must be a boolean').optional().isBoolean(),
  check('isActive', 'Is active must be a boolean').optional().isBoolean()
];

// @route   POST /api/subscription-plans
// @desc    Create a new subscription plan
// @access  Private/Admin
router.post(
  '/',
  [verifyToken, ...subscriptionPlanValidation],
  subscriptionPlanController.createSubscriptionPlan
);

// @route   GET /api/subscription-plans
// @desc    Get all subscription plans
// @access  Public
router.get('/', subscriptionPlanController.getAllSubscriptionPlans);

// @route   GET /api/subscription-plans/:id
// @desc    Get subscription plan by ID
// @access  Public
router.get('/:id', subscriptionPlanController.getSubscriptionPlanById);

// @route   PUT /api/subscription-plans/:id
// @desc    Update subscription plan
// @access  Private/Admin
router.put(
  '/:id',
  [verifyToken, ...subscriptionPlanValidation],
  subscriptionPlanController.updateSubscriptionPlan
);

// @route   DELETE /api/subscription-plans/:id
// @desc    Delete subscription plan
// @access  Private/Admin
router.delete('/:id', verifyToken, subscriptionPlanController.deleteSubscriptionPlan);

// @route   POST /api/subscription-plans/add-service
// @desc    Add a service to a subscription plan
// @access  Private/Admin
router.post(
  '/add-service',
  [
    verifyToken,
    check('planId', 'Plan ID is required').not().isEmpty(),
    check('serviceId', 'Service ID is required').not().isEmpty(),
    check('isIncluded', 'Is included must be a boolean').optional().isBoolean()
  ],
  subscriptionPlanController.addPlanService
);

// @route   DELETE /api/subscription-plans/:planId/services/:serviceId
// @desc    Remove a service from a subscription plan
// @access  Private/Admin
router.delete(
  '/:planId/services/:serviceId',
  verifyToken,
  subscriptionPlanController.removePlanService
);

// @route   GET /api/subscription-plans/:planId/services
// @desc    Get all services for a specific plan
// @access  Public
router.get(
  '/:planId/services',
  subscriptionPlanController.getPlanServices
);

module.exports = router;
