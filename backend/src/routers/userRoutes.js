const express = require('express');
const { body, query, param } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  uploadAvatar
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { uploadSingle } = require('../middlewares/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['customer', 'barber', 'admin'])
    .withMessage('Role must be customer, barber, or admin'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false')
];

const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID')
];

const updateUserValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Please provide a valid phone number (10-11 digits)'),
  body('role')
    .optional()
    .isIn(['customer', 'barber', 'admin'])
    .withMessage('Role must be customer, barber, or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Admin only routes
router.get(
  '/',
  authorize('admin'),
  getUsersValidation,
  validate,
  getAllUsers
);

router.get(
  '/:id',
  authorize('admin'),
  userIdValidation,
  validate,
  getUserById
);

router.put(
  '/:id',
  authorize('admin'),
  updateUserValidation,
  validate,
  updateUser
);

router.patch(
  '/:id/status',
  authorize('admin'),
  userIdValidation,
  validate,
  toggleUserStatus
);

router.delete(
  '/:id',
  authorize('admin'),
  userIdValidation,
  validate,
  deleteUser
);

// Avatar upload - accessible by admin or the user themselves
router.post(
  '/:id/avatar',
  userIdValidation,
  validate,
  uploadSingle('avatar', 'avatars'),
  uploadAvatar
);

module.exports = router;
