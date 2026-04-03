const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createReview,
  getReviews,
  getBarberReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation rules
const reviewIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID')
];

const barberIdValidation = [
  param('barberId')
    .isMongoId()
    .withMessage('Invalid barber ID')
];

const createReviewValidation = [
  body('appointmentId')
    .notEmpty()
    .withMessage('Appointment ID is required')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

const updateReviewValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

const getReviewsValidation = [
  query('barberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid barber ID'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'highest', 'lowest'])
    .withMessage('Invalid sort value'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const getBarberReviewsValidation = [
  param('barberId')
    .isMongoId()
    .withMessage('Invalid barber ID'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'highest', 'lowest'])
    .withMessage('Invalid sort value'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Public routes
router.get(
  '/',
  getReviewsValidation,
  validate,
  getReviews
);

router.get(
  '/barber/:barberId',
  getBarberReviewsValidation,
  validate,
  getBarberReviews
);

// Protected route - must be before /:id to avoid 'my' being treated as an ID
router.get(
  '/my',
  protect,
  authorize('customer'),
  paginationValidation,
  validate,
  getMyReviews
);

// Public route for getting review by ID
router.get(
  '/:id',
  reviewIdValidation,
  validate,
  getReviewById
);

// Protected routes
router.post(
  '/',
  protect,
  authorize('customer'),
  createReviewValidation,
  validate,
  createReview
);

router.put(
  '/:id',
  protect,
  authorize('customer'),
  updateReviewValidation,
  validate,
  updateReview
);

router.delete(
  '/:id',
  protect,
  authorize('customer', 'admin', 'barber'),
  reviewIdValidation,
  validate,
  deleteReview
);

module.exports = router;
