const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getActiveServices,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { uploadSingle } = require('../middlewares/upload');

const router = express.Router();

// Validation rules
const getServicesValidation = [
  query('category')
    .optional()
    .isIn(['haircut', 'shave', 'styling', 'combo', 'other'])
    .withMessage('Category must be haircut, shave, styling, combo, or other'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative number')
];

const serviceIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid service ID')
];

const createServiceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 5 })
    .withMessage('Duration must be at least 5 minutes'),
  body('category')
    .optional()
    .isIn(['haircut', 'shave', 'styling', 'combo', 'other'])
    .withMessage('Category must be haircut, shave, styling, combo, or other')
];

const updateServiceValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid service ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('duration')
    .optional()
    .isInt({ min: 5 })
    .withMessage('Duration must be at least 5 minutes'),
  body('category')
    .optional()
    .isIn(['haircut', 'shave', 'styling', 'combo', 'other'])
    .withMessage('Category must be haircut, shave, styling, combo, or other'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Public routes
router.get(
  '/',
  getServicesValidation,
  validate,
  getActiveServices
);

// Admin only route - must be before /:id to avoid matching 'all' as an ID
router.get(
  '/all',
  protect,
  authorize('admin', 'barber'),
  getServicesValidation,
  validate,
  getAllServices
);

router.get(
  '/:id',
  serviceIdValidation,
  validate,
  getServiceById
);

router.post(
  '/',
  protect,
  authorize('admin', 'barber'),
  uploadSingle('image', 'services'),
  createServiceValidation,
  validate,
  createService
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'barber'),
  uploadSingle('image', 'services'),
  updateServiceValidation,
  validate,
  updateService
);

router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'barber'),
  serviceIdValidation,
  validate,
  toggleServiceStatus
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'barber'),
  serviceIdValidation,
  validate,
  deleteService
);

module.exports = router;
