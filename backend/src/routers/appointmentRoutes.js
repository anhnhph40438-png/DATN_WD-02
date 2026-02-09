const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  confirmAppointment,
  rejectAppointment,
  startAppointment,
  completeAppointment,
  cancelAppointment,
  rescheduleAppointment
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation rules
const appointmentIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid appointment ID')
];

const createAppointmentValidation = [
  body('barberId')
    .notEmpty()
    .withMessage('Barber ID is required')
    .isMongoId()
    .withMessage('Invalid barber ID'),
  body('serviceIds')
    .notEmpty()
    .withMessage('At least one service is required')
    .isArray({ min: 1 })
    .withMessage('Services must be an array with at least one service'),
  body('serviceIds.*')
    .isMongoId()
    .withMessage('Invalid service ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:mm format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const getAppointmentsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  query('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const rejectAppointmentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const cancelAppointmentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const rescheduleAppointmentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:mm format')
];

// All routes require authentication
router.use(protect);

// Customer routes
router.post(
  '/',
  authorize('customer'),
  createAppointmentValidation,
  validate,
  createAppointment
);

// Get appointments (filtered by role automatically)
router.get(
  '/',
  authorize('customer', 'barber', 'admin'),
  getAppointmentsValidation,
  validate,
  getAppointments
);

// Get appointment by ID
router.get(
  '/:id',
  authorize('customer', 'barber', 'admin'),
  appointmentIdValidation,
  validate,
  getAppointmentById
);

// Barber routes - status transitions
router.patch(
  '/:id/confirm',
  authorize('barber'),
  appointmentIdValidation,
  validate,
  confirmAppointment
);

router.patch(
  '/:id/reject',
  authorize('barber'),
  rejectAppointmentValidation,
  validate,
  rejectAppointment
);

router.patch(
  '/:id/start',
  authorize('barber'),
  appointmentIdValidation,
  validate,
  startAppointment
);

router.patch(
  '/:id/complete',
  authorize('barber'),
  appointmentIdValidation,
  validate,
  completeAppointment
);

// Customer/Admin routes
router.patch(
  '/:id/cancel',
  authorize('customer', 'admin'),
  cancelAppointmentValidation,
  validate,
  cancelAppointment
);

// Customer routes
router.put(
  '/:id/reschedule',
  authorize('customer'),
  rescheduleAppointmentValidation,
  validate,
  rescheduleAppointment
);

module.exports = router;
