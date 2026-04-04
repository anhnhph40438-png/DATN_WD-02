const express = require('express');
const { param, query, body } = require('express-validator');
const {
  createPayment,
  vnpayReturn,
  vnpayIpn,
  getTransactions,
  getTransactionById,
  getMyTransactions,
  processRefund
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation rules
const appointmentIdValidation = [
  param('appointmentId')
    .isMongoId()
    .withMessage('Invalid appointment ID')
];

const transactionIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid transaction ID')
];

const getTransactionsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'success', 'failed', 'refunded'])
    .withMessage('Invalid status value'),
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

const refundValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid transaction ID'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// VNPay callback routes (public - no auth required)
// These are called by VNPay servers
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIpn);

// Protected routes
router.use(protect);

// Customer routes
router.post(
  '/create/:appointmentId',
  authorize('customer'),
  appointmentIdValidation,
  validate,
  createPayment
);

router.get(
  '/my',
  authorize('customer'),
  getTransactionsValidation,
  validate,
  getMyTransactions
);

// Admin routes
router.get(
  '/transactions',
  authorize('admin', 'barber'),
  getTransactionsValidation,
  validate,
  getTransactions
);

router.get(
  '/transactions/:id',
  authorize('admin', 'barber'),
  transactionIdValidation,
  validate,
  getTransactionById
);

router.post(
  '/:id/refund',
  authorize('admin', 'barber'),
  refundValidation,
  validate,
  processRefund
);

module.exports = router;
