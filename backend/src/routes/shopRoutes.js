const express = require('express');
const { body, param } = require('express-validator');
const {
  getShop,
  updateShop,
  updateOpeningHours,
  uploadShopImages,
  deleteShopImage
} = require('../controllers/shopController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { uploadMultiple } = require('../middlewares/upload');

const router = express.Router();

// Validation rules
const updateShopValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Please provide a valid phone number (10-11 digits)'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updateHoursValidation = [
  body('openingHours')
    .notEmpty()
    .withMessage('Opening hours object is required')
    .isObject()
    .withMessage('Opening hours must be an object')
];

const deleteImageValidation = [
  param('index')
    .isInt({ min: 0 })
    .withMessage('Image index must be a non-negative integer')
];

// Public route
router.get('/', getShop);

// Admin only routes
router.put(
  '/',
  protect,
  authorize('admin', 'barber'),
  updateShopValidation,
  validate,
  updateShop
);

router.patch(
  '/hours',
  protect,
  authorize('admin', 'barber'),
  updateHoursValidation,
  validate,
  updateOpeningHours
);

router.post(
  '/images',
  protect,
  authorize('admin', 'barber'),
  uploadMultiple('images', 10, 'shop'),
  uploadShopImages
);

router.delete(
  '/images/:index',
  protect,
  authorize('admin', 'barber'),
  deleteImageValidation,
  validate,
  deleteShopImage
);

module.exports = router;
