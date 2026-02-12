const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  applyPromotion,
  validatePromotion
} = require('../controllers/promotionController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation rules
const promotionIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid promotion ID')
];

const createPromotionValidation = [
  body('code')
    .notEmpty()
    .withMessage('Promotion code is required')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Promotion code must be between 3 and 20 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Promotion code can only contain letters and numbers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either "percentage" or "fixed"'),
  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a positive number'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be a positive number'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('applicableServices')
    .optional()
    .isArray()
    .withMessage('Applicable services must be an array'),
  body('applicableServices.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid service ID in applicableServices')
];

const updatePromotionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid promotion ID'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Promotion code must be between 3 and 20 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Promotion code can only contain letters and numbers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either "percentage" or "fixed"'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a positive number'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be a positive number'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('applicableServices')
    .optional()
    .isArray()
    .withMessage('Applicable services must be an array'),
  body('applicableServices.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid service ID in applicableServices')
];

const getPromotionsValidation = [
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters')
];

const applyPromotionValidation = [
  body('code')
    .notEmpty()
    .withMessage('Promotion code is required')
    .trim(),
  body('orderAmount')
    .notEmpty()
    .withMessage('Order amount is required')
    .isFloat({ min: 0 })
    .withMessage('Order amount must be a positive number'),
  body('serviceIds')
    .optional()
    .isArray()
    .withMessage('Service IDs must be an array'),
  body('serviceIds.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid service ID')
];

const validatePromotionValidation = [
  param('code')
    .notEmpty()
    .withMessage('Promotion code is required')
    .trim()
];

// All routes require authentication
router.use(protect);

// Customer routes
router.post(
  '/apply',
  authorize('customer'),
  applyPromotionValidation,
  validate,
  applyPromotion
);

router.get(
  '/validate/:code',
  authorize('customer'),
  validatePromotionValidation,
  validate,
  validatePromotion
);

// Admin routes
router.post(
  '/',
  authorize('admin'),
  createPromotionValidation,
  validate,
  createPromotion
);

router.get(
  '/',
  authorize('admin'),
  getPromotionsValidation,
  validate,
  getPromotions
);

router.get(
  '/:id',
  authorize('admin'),
  promotionIdValidation,
  validate,
  getPromotionById
);

router.put(
  '/:id',
  authorize('admin'),
  updatePromotionValidation,
  validate,
  updatePromotion
);

router.delete(
  '/:id',
  authorize('admin'),
  promotionIdValidation,
  validate,
  deletePromotion
);

router.patch(
  '/:id/status',
  authorize('admin'),
  promotionIdValidation,
  validate,
  togglePromotionStatus
);

module.exports = router;
