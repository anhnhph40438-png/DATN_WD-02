const express = require('express');
const { param, query } = require('express-validator');
const {
  getDashboardStats,
  getRevenueStats,
  getAppointmentStats,
  getCustomerStats,
  getBarberStats,
  getBarberPersonalStats,
  getServiceStats
} = require('../controllers/statisticsController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation rules
const periodValidation = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Period must be one of: day, week, month, year'),
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format')
];

const barberIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid barber ID')
];

// All routes require authentication
router.use(protect);

// Admin routes
router.get(
  '/dashboard',
  authorize('admin', 'barber'),
  getDashboardStats
);

router.get(
  '/revenue',
  authorize('admin', 'barber'),
  periodValidation,
  validate,
  getRevenueStats
);

router.get(
  '/appointments',
  authorize('admin', 'barber'),
  periodValidation,
  validate,
  getAppointmentStats
);

router.get(
  '/customers',
  authorize('admin', 'barber'),
  getCustomerStats
);

router.get(
  '/barbers',
  authorize('admin', 'barber'),
  periodValidation,
  validate,
  getBarberStats
);

router.get(
  '/services',
  authorize('admin', 'barber'),
  periodValidation,
  validate,
  getServiceStats
);

// Barber personal statistics (barbers can view their own, admin can view any)
router.get(
  '/barber/:id',
  authorize('barber', 'admin'),
  barberIdValidation,
  periodValidation,
  validate,
  getBarberPersonalStats
);

module.exports = router;
