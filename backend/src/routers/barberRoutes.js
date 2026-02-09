const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAvailableBarbers,
  getAllBarbers,
  getBarberById,
  createBarber,
  updateBarber,
  updateWorkingHours,
  toggleBarberStatus,
  deleteBarber,
  getAvailableSlots
} = require('../controllers/barberController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation rules
const barberIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid barber ID')
];

const createBarberValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Please provide a valid phone number (10-11 digits)'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
];

const updateBarberValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid barber ID'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('portfolio')
    .optional()
    .isArray()
    .withMessage('Portfolio must be an array of image URLs')
];

const updateScheduleValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid barber ID'),
  body('workingHours')
    .notEmpty()
    .withMessage('Working hours object is required')
    .isObject()
    .withMessage('Working hours must be an object')
];

const availableSlotsValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid barber ID'),
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
];

// Public routes
router.get('/', getAvailableBarbers);

// Admin only route - must be before /:id to avoid matching 'all' as an ID
router.get(
  '/all',
  protect,
  authorize('admin'),
  getAllBarbers
);

router.get(
  '/:id',
  barberIdValidation,
  validate,
  getBarberById
);

router.get(
  '/:id/available-slots',
  availableSlotsValidation,
  validate,
  getAvailableSlots
);

router.post(
  '/',
  protect,
  authorize('admin'),
  createBarberValidation,
  validate,
  createBarber
);

router.patch(
  '/:id/status',
  protect,
  authorize('admin'),
  barberIdValidation,
  validate,
  toggleBarberStatus
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  barberIdValidation,
  validate,
  deleteBarber
);

// Barber or Admin routes
router.put(
  '/:id',
  protect,
  authorize('barber', 'admin'),
  updateBarberValidation,
  validate,
  updateBarber
);

router.patch(
  '/:id/schedule',
  protect,
  authorize('barber', 'admin'),
  updateScheduleValidation,
  validate,
  updateWorkingHours
);

module.exports = router;
